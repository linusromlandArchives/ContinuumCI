// External dependencies
import { Injectable } from '@nestjs/common';

// Internal dependencies
import { WelcomeType } from 'shared/src/types';

@Injectable()
export class WelcomeService {
	getWelcomeMessage(): WelcomeType {
		return {
			message: 'ContinuumCI API',
			firstTimeSetup: true
		};
	}
}