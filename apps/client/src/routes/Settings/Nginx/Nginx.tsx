// External dependencies
import { useEffect, useState } from 'react';
import * as Yup from 'yup';
import clsx from 'clsx';
import Select from 'react-select';

// Internal dependencies
import Breadcrumbs from '../../../components/Breadcrumbs/Breadcrumbs';
import Button from '../../../components/Button/Button';
import Widget from '../../../components/Widget/Widget';
import style from './Nginx.module.scss';
import {
	createDomain,
	deleteDomain,
	getDomains
} from '../../../utils/api/nginx/domains';
import { toast } from 'react-toastify';
import { DomainsClass } from 'shared/src/classes';
import TextEditModal from '../../../components/TextEditModal/TextEditModal';

export default function Nginx(): JSX.Element {
	const [domainNames, setDomainNames] = useState([] as DomainsClass[]);
	const [newDomainName, setNewDomainName] = useState('');
	const [sitesEnabledDirectoryModal, setSitesEnabledDirectoryModal] =
		useState(false);
	const [accessLogLocationModal, setAccessLogLocationModal] = useState(false);
	const [localIpAdressesModal, setLocalIpAdressesModal] = useState(false);
	const [selectedDomainName, setSelectedDomainName] = useState(
		{} as {
			value: string;
			label: string;
		} | null
	);

	async function getDomainsData() {
		const response = await getDomains();
		if (response.success) {
			setDomainNames(response.data as DomainsClass[]);
		}
	}

	useEffect(() => {
		getDomainsData();
	}, []);

	const customStyles = {
		control: (provided: object) => ({
			...provided,
			border: '2px solid #dadada',
			borderRadius: '0.25rem',
			fontSize: '0.8rem',
			fontWeight: 700,
			margin: '0'
		}),
		valueContainer: (provided: object) => ({
			...provided,
			padding: '0rem'
		})
	};

	return (
		<>
			<div className={style.main}>
				<Breadcrumbs path={[{ name: 'Settings' }, { name: 'Nginx' }]} />

				<h1 className={style.title}>Nginx Settings</h1>
				<Widget>
					<div className={style.container}>
						<h2 className={style.subtitle}>Configuration</h2>

						<div className={style.infoContainer}>
							<h3
								className={clsx(
									style.infoContainerTitle,
									style.row1,
									style.col1
								)}
							>
								Sites Enabled Directory:
							</h3>
							<p
								className={clsx(
									style.infoContainerValue,
									style.row1,
									style.col2
								)}
							>
								/etc/nginx/sites-enabled
							</p>
							<Button
								text='Change'
								onClick={() =>
									setSitesEnabledDirectoryModal(true)
								}
								small
								secondary
								className={clsx(style.row1, style.col3)}
							/>
							<h3
								className={clsx(
									style.infoContainerTitle,
									style.row2,
									style.col1
								)}
							>
								Access Log Location:
							</h3>
							<p
								className={clsx(
									style.infoContainerValue,
									style.row2,
									style.col2
								)}
							>
								/var/log/nginx/custom.log
							</p>
							<Button
								text='Change'
								onClick={() => setAccessLogLocationModal(true)}
								small
								secondary
								className={clsx(style.row2, style.col3)}
							/>
							<h3
								className={clsx(
									style.infoContainerTitle,
									style.row3,
									style.col1
								)}
							>
								Local IP-Adresses:
							</h3>
							<p
								className={clsx(
									style.infoContainerValue,
									style.row3,
									style.col2
								)}
							>
								192.168.1.0/24
							</p>
							<Button
								text='Change'
								onClick={() => setLocalIpAdressesModal(true)}
								small
								secondary
								className={clsx(style.row3, style.col3)}
							/>
						</div>
					</div>
				</Widget>
				<Widget>
					<div className={style.container}>
						<h2 className={style.subtitle}>Domain names</h2>

						{/* List of all avaible domain names, button to remove a domain name & input to add a new domain name */}
						<div className={style.infoContainer}>
							<h3
								className={clsx(
									style.infoContainerTitle,
									style.row1,
									style.col1
								)}
							>
								Available domain names:
							</h3>
							{/* List of all domain names */}
							{domainNames.map((domainName, index) => (
								<p
									className={clsx(
										style.infoContainerValue,
										style[`row${index + 1}`],
										style.col2
									)}
								>
									{domainName.name}
								</p>
							))}

							{domainNames.length === 0 && (
								<p
									className={clsx(
										style.infoContainerValue,
										style.row1,
										style.col2
									)}
								>
									No domain names available
								</p>
							)}
						</div>
						<div
							className={clsx(style.infoContainer, style.actions)}
						>
							<h3
								className={clsx(
									style.infoContainerTitle,
									style.row1,
									style.col1
								)}
							>
								Add domain name:
							</h3>
							<input
								className={clsx(
									style.input,
									style.row1,
									style.col2
								)}
								type='text'
								placeholder='example.com'
								value={newDomainName}
								onChange={(e) => {
									setNewDomainName(e.target.value);
								}}
							/>

							<Button
								text='Add'
								small
								secondary
								className={clsx(style.row1, style.col3)}
								onClick={async () => {
									if (!newDomainName) return;

									const response = await createDomain(
										newDomainName
									);

									if (response) {
										getDomainsData();
										setNewDomainName('');
									} else {
										toast.error('Failed to create domain');
									}
								}}
							/>
						</div>
						<div className={style.infoContainer}>
							<h3
								className={clsx(
									style.infoContainerTitle,
									style.row1,
									style.col1
								)}
							>
								Remove domain name:
							</h3>

							<Select
								className={clsx(style.row1, style.col2)}
								styles={customStyles}
								onChange={(option) => {
									if (option && option.value)
										setSelectedDomainName(option);
								}}
								value={selectedDomainName}
								options={domainNames.map((domainName) => ({
									value: domainName._id,
									label: domainName.name
								}))}
							/>
							<Button
								text='Remove'
								small
								secondary
								className={clsx(style.row1, style.col3)}
								onClick={async () => {
									if (!selectedDomainName) return;

									const response = await deleteDomain(
										selectedDomainName.value
									);

									if (response) {
										getDomainsData();
										setSelectedDomainName(null);
									} else {
										toast.error('Failed to delete domain');
									}
								}}
							/>
						</div>
					</div>
				</Widget>
			</div>

			<TextEditModal
				title='Change Sites Enabled Directory'
				fieldName='sitesEnabledDirectory'
				open={sitesEnabledDirectoryModal}
				onClose={() => {
					setSitesEnabledDirectoryModal(false);
				}}
				initialValues={{
					sitesEnabledDirectory: 'sitesEnabledDirectory'
				}}
				validationSchema={Yup.object().shape({
					sitesEnabledDirectory: Yup.string().required(
						'Sites Enabled Directory is required'
					)
				})}
				submit={async (values) => {
					console.log(values);
				}}
			/>

			<TextEditModal
				title='Change Access Log Location'
				fieldName='accessLogLocation'
				open={accessLogLocationModal}
				onClose={() => {
					setAccessLogLocationModal(false);
				}}
				initialValues={{
					accessLogLocation: 'accessLogLocation'
				}}
				validationSchema={Yup.object().shape({
					accessLogLocation: Yup.string().required(
						'Access Log Location is required'
					)
				})}
				submit={async (values) => {
					console.log(values);
				}}
			/>

			<TextEditModal
				title='Change Local IP-Adresses'
				fieldName='localIpAdresses'
				open={localIpAdressesModal}
				onClose={() => {
					setLocalIpAdressesModal(false);
				}}
				initialValues={{
					localIpAdresses: 'localIpAdresses'
				}}
				validationSchema={Yup.object().shape({
					localIpAdresses: Yup.string().required(
						'Local IP-Adresses is required'
					)
				})}
				submit={async (values) => {
					console.log(values);
				}}
			/>
		</>
	);
}
