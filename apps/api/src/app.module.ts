// External dependencies
import { Module } from '@nestjs/common';

// Modules import
import { AuthModule } from './routes/auth/auth.module';
import { NginxModule } from './routes/nginx/nginx.module';
import { OverviewModule } from './routes/overview/overview.module';
import { EmailConfigurationModule } from './routes/emailConfiguration/emailConfiguration.module';
import { EnvironmentVariablesModule } from './routes/environmentVariables/environmentVariables.module';
import { ProjectsModule } from './routes/projects/projects.module';
import { SetupModule } from './routes/setup/setup.module';
import { UsersModule } from './routes/users/users.module';
import { WelcomeModule } from './routes/welcome/welcome.module';

@Module({
	imports: [
		AuthModule,
		NginxModule,
		OverviewModule,
		EmailConfigurationModule,
		EnvironmentVariablesModule,
		ProjectsModule,
		SetupModule,
		UsersModule,
		WelcomeModule
	]
})
export class AppModule {}
