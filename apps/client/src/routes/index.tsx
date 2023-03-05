// External dependencies
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Routes imports
import RootLayout from '../components/Layouts/RootLayout/RootLayout';
import SetupLayout from '../components/Layouts/SetupLayout/SetupLayout';
import Home from './Home/Home';
import Login from './Login/Login';
import Setup from './Setup/Setup';
import Welcome from './Welcome/Welcome';

export default function Router(): JSX.Element {
	return (
		<BrowserRouter>
			<Routes>
				<Route
					path='/'
					element={<RootLayout />}
				>
					<Route
						path='/'
						element={<Home />}
					/>
					<Route element={<SetupLayout />}>
						<Route
							path='/welcome'
							element={<Welcome />}
						/>
						<Route
							path='/login'
							element={<Login />}
						/>
						<Route
							path='/setup'
							element={<Setup />}
						/>
					</Route>
					<Route
						path='*'
						element={<Navigate to='/' />}
					/>
				</Route>
			</Routes>
		</BrowserRouter>
	);
}
