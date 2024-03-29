// External dependencies
import { useEffect, useState } from 'react';

// Internal dependencies
import style from './Domains.module.scss';
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs';
import { NginxDeploymentClass } from 'shared/src/classes';
import Widget from '../../components/Widget/Widget';
import Table from '../../components/Table/Table';
import { Loading } from '../../components/Loading/Loading';
import { getDeployments } from '../../utils/api/nginx/deployment';
import DomainModal from './components/DomainModal/DomainModal';
import CreateDomainModal from './components/CreateDomainModal/CreateDomainModal';
import Button from '../../components/Button/Button';
import useTranslations from '../../i18n/translations';

export default function Domains() {
	const t = useTranslations();

	const [domains, setDomains] = useState([] as NginxDeploymentClass[]);
	const [selectedDomain, setSelectedDomain] = useState({} as NginxDeploymentClass);
	const [viewModalOpen, setViewModalOpen] = useState(false);
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [dataReady, setDataReady] = useState(false);

	useEffect(() => {
		getData();
	}, []);

	async function getData() {
		setDataReady(false);
		const response = await getDeployments();
		if (response.success && response.data) {
			setDomains(response.data);
		}
		setDataReady(true);
	}

	if (!dataReady) return <Loading />;

	return (
		<>
			<main className={style.main}>
				<Breadcrumbs
					path={[
						{
							name: t.domains.title,
							link: '/domains'
						}
					]}
				/>
				<h1 className={style.title}>{t.domains.title}</h1>
				<Button
					text={t.domains.createDomain}
					theme='success'
					small
					onClick={() => setCreateModalOpen(true)}
				/>
				<div className={style.content}>
					{domains && domains.length > 0 && (
						<>
							<Widget contentClass={style.contentClass}>
								<div className={style.container}>
									<Table
										widget={false}
										headers={[t.domains.serverName, t.domains.locations, t.domains.sslConfigured]}
										data={domains.map((domain) => [
											domain.server_name,
											`${domain.locations.length} location${
												domain.locations.length > 1 ? 's' : ''
											}`,
											domain.ssl ? t.domains.yes : t.domains.no
										])}
										onRowClick={(row) => {
											const clickedDomain = domains.find(
												(domain) => domain.server_name === row[0]
											);

											if (clickedDomain) {
												setSelectedDomain(clickedDomain);
												setViewModalOpen(true);
											}
										}}
									/>
								</div>
							</Widget>
						</>
					)}
					{domains && domains.length === 0 && (
						<>
							<p>{t.domains.noDomainsFound}</p>
						</>
					)}
				</div>
			</main>
			<DomainModal
				open={viewModalOpen}
				onClose={(update) => {
					setViewModalOpen(false);
					if (update) getData();
				}}
				domain={selectedDomain}
			/>
			<CreateDomainModal
				open={createModalOpen}
				onClose={(update) => {
					setCreateModalOpen(false);
					if (update) getData();
				}}
			/>
		</>
	);
}
