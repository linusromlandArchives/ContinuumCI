// External dependencies
import { Schema } from 'mongoose';

export const EmailConfigurationSchema = new Schema(
	{
		service: {
			type: String,
			required: true,
			enum: ['gmail', 'skipped']
		},
		auth: {
			user: {
				type: String
			},
			pass: {
				type: String
			}
		}
	},
	{
		timestamps: true
	}
);
