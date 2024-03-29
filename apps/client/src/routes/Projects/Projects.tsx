// External dependencies
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Internal dependencies
import Button from '../../components/Button/Button';
import style from './Projects.module.scss';
import Header from './components/Header/Header';
import StatusBar from './components/StatusBar/StatusBar';
import ProjectCard from './components/ProjectCard/ProjectCard';
import ProjectCreateModal from './components/ProjectCreateModal/ProjectCreateModal';
import { getAllProjects, createProject } from '../../utils/api/projects';
import { ProjectClass } from 'shared/src/classes';
import { ProjectDeploymentStatus } from 'shared/src/enums';
import { Loading } from '../../components/Loading/Loading';
import useTranslations from '../../i18n/translations';

export default function Projects() {
	const t = useTranslations();
	const navigate = useNavigate();

	const [modalOpen, setModalOpen] = useState(false as boolean);
	const [projects, setProjects] = useState([] as ProjectClass[]);
	const [searchFilter, setSearchFilter] = useState('' as string);
	const [lastUpdated, setLastUpdated] = useState('' as string);
	const [dataReady, setDataReady] = useState(false);

	async function getProjects() {
		setDataReady(false);
		const response = await getAllProjects();
		if (response.success && response.data) {
			setProjects(response.data);
		}
		setDataReady(true);
		setLastUpdated(new Date().toISOString());
	}

	useEffect(() => {
		getProjects();
	}, []);

	if (!dataReady) return <Loading />;

	return (
		<>
			<main className={style.main}>
				<Header
					lastUpdated={lastUpdated}
					onRefresh={getProjects}
				/>
				<div className={style.container}>
					<div className={style.topBar}>
						<div className={style.statusBar}>
							<StatusBar
								succeeded={
									projects.length
										? (projects.filter(
												(project) =>
													project.deploymentStatus === ProjectDeploymentStatus.RUNNING
										  ).length /
												projects.length) *
										  100
										: 100
								}
								warning={
									projects.length
										? (projects.filter(
												(project) =>
													project.deploymentStatus ===
													ProjectDeploymentStatus.PARTIALLY_RUNNING
										  ).length /
												projects.length) *
										  100
										: 0
								}
								failed={
									projects.length
										? (projects.filter(
												(project) =>
													project.deploymentStatus !== ProjectDeploymentStatus.RUNNING &&
													project.deploymentStatus !==
														ProjectDeploymentStatus.PARTIALLY_RUNNING
										  ).length /
												projects.length) *
										  100
										: 0
								}
							/>
						</div>
						<Button
							text={t.projects.newProjectButton}
							onClick={() => {
								setModalOpen(true);
							}}
						/>
					</div>

					<div className={style.filters}>
						<input
							className={style.input}
							type='text'
							placeholder={t.projects.search}
							onChange={(e) => setSearchFilter(e.target.value)}
							value={searchFilter}
						/>
					</div>

					<div className={style.projects}>
						{projects
							.filter((project) => {
								if (!searchFilter) return true;
								return project.name.toLowerCase().includes(searchFilter.toLowerCase());
							})
							.map((project) => (
								<ProjectCard
									key={project._id}
									project={project}
									onClick={() => {
										navigate(`/projects/${project._id}`);
									}}
								/>
							))}

						{projects.filter((project) => {
							if (!searchFilter) return true;
							return project.name.toLowerCase().includes(searchFilter.toLowerCase());
						}).length === 0 && <p className={style.noProjects}>{t.projects.noProjects}</p>}
					</div>
				</div>
			</main>
			<ProjectCreateModal
				open={modalOpen}
				onClose={() => setModalOpen(false)}
				submit={async (values) => {
					const response = await createProject({
						name: values.name,
						gitUrl: values.gitUrl,
						branch: values.branch
					});

					if (response.success) {
						toast.success(t.projects.newProject.successCreate);
						setModalOpen(false);
						getProjects();
					} else {
						toast.error(t.projects.newProject.errorCreate);
					}
				}}
			/>
		</>
	);
}
