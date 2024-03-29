// External dependencies
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import fs from 'fs';

// Internal dependencies
import { NginxConfigurationType, NginxLogsType } from 'shared/src/types';
import { NginxResumeType } from '../types';

// Local variables
let logWatcherInterval: NodeJS.Timer | null = null;
@Injectable()
export class LogWatcherService {
	private readonly logger = new Logger(LogWatcherService.name);

	constructor(
		@Inject('NGINX_LOGS_MODEL')
		private NginxLogsModel: Model<NginxLogsType>,
		@Inject('NGINX_RESUME_MODEL')
		private NginxResumeModel: Model<NginxResumeType>,
		@Inject('NGINX_CONFIGURATION_MODEL')
		private NginxConfigurationModel: Model<NginxConfigurationType>
	) {
		this.startLogWatcher();
	}

	async startLogWatcher() {
		if (logWatcherInterval) {
			clearInterval(logWatcherInterval);
		}

		let configuration = await this.NginxConfigurationModel.findOne({});

		if (!configuration) {
			this.logger.error('No configuration found, creating default');

			configuration = new this.NginxConfigurationModel({
				localIps: '192.168.1.0/24',
				sitesEnabledLocation: '/etc/nginx/sites-enabled',
				accessLogLocation: '/var/log/nginx/custom.log'
			});
			const savedConfiguration = await configuration.save();

			if (!savedConfiguration) {
				this.logger.error('Error creating default configuration');
				return;
			}

			configuration = savedConfiguration;
		}

		this.logger.log(`Starting watching for logs in file ${configuration.accessLogLocation}`);

		logWatcherInterval = setInterval(async () => {
			try {
				this.logger.log('Checking for new logs');

				// Read the file
				const file = fs.readFileSync(configuration.accessLogLocation, 'utf8');

				// Split the file into lines
				const lines = file.split('\n');

				// Get the last line number we saved
				const lineStart = await this.NginxResumeModel.findOne({}).select('resume_position');

				// Loop through each line
				for (let i = lineStart ? lineStart.resume_position : 0; i < lines.length; i++) {
					const line = lines[i];

					// Skip empty lines
					if (line === '') continue;

					// Save the current line number so we can resume from here next time
					await this.NginxResumeModel.findOneAndUpdate({}, { resume_position: i + 1 }, { upsert: true });

					// Split the line into parts
					const parts = line.split(' __|__');

					const obj: {
						[key: string]: string;
					} = {};

					// Split each part into key and value
					for (let j = 0; j < parts.length; j++) {
						const part = parts[j];
						const partParts = part.split('__:__');
						obj[partParts[0]] = partParts[1];
					}

					// Save the log
					try {
						const nginx = new this.NginxLogsModel(obj);
						await nginx.save();
						this.logger.log('New nginx log saved');
					} catch (err) {
						this.logger.warn('Error saving nginx log');
					}
				}
			} catch (error) {
				this.logger.error('Something went wrong while watching access.log');
			}
		}, 30000); // Check for new logs every 30 seconds
	}
}
