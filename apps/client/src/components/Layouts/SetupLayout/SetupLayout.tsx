// External Dependencies
import { useCallback } from 'react';
import { loadFull } from 'tsparticles';
import { Outlet, useNavigate } from 'react-router-dom';
import Particles from 'react-tsparticles';
import type { Engine } from 'tsparticles-engine';

// Internal Dependencies
import style from './SetupLayout.module.scss';
import useTranslations from '../../../i18n/translations';

export default function SetupLayout(): JSX.Element {
	const t = useTranslations();
	const navigate = useNavigate();

	const particlesInit = useCallback(async (engine: Engine) => {
		await loadFull(engine);
	}, []);

	return (
		<div className={style.main}>
			<div className={style.content}>
				<div>
					<div
						className={style.logoWrapper}
						onClick={() => {
							navigate('/login');
						}}
					>
						<img
							src='/logo.svg'
							alt='ContinuumCI Logo'
							className={style.logo}
						/>
						<h1 className={style.title}>ContinuumCI</h1>
					</div>
					<Outlet />
				</div>
				<div className={style.footer}>
					<p>
						{t.setupSidebar.footer} <a href='https://github.com/linusromland/ContinuumCI'>GitHub</a>.
					</p>
				</div>
			</div>
			<Particles
				id='tsparticles'
				init={particlesInit}
				className={style.particles}
				options={{
					fpsLimit: 60,
					interactivity: {
						events: {
							onClick: {
								enable: true,
								mode: 'push'
							},
							onHover: {
								enable: true,
								mode: 'grab',
								parallax: {
									enable: true,
									force: 100,
									smooth: 10
								}
							},
							resize: true
						},
						modes: {
							push: {
								quantity: 4
							},
							grab: {
								distance: 200,
								links: {
									blink: false,
									consent: false,
									opacity: 1
								}
							}
						}
					},
					particles: {
						color: {
							value: '#ffffff'
						},
						links: {
							color: '#ffffff',
							distance: 200,
							enable: true,
							opacity: 0.8,
							width: 1
						},
						collisions: {
							enable: true
						},
						move: {
							direction: 'none',
							enable: true,
							outModes: {
								default: 'bounce'
							},
							random: false,
							speed: 1,
							straight: false
						},
						number: {
							density: {
								enable: true,
								area: 1000
							},
							value: 100
						},

						shape: {
							type: 'rectangle'
						},
						size: {
							value: { min: 1, max: 6 }
						}
					},
					detectRetina: true
				}}
			/>
		</div>
	);
}
