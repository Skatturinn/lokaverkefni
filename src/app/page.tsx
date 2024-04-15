// 'use client'
import { getDistmatrix, getLocationKronan, getLocationNetto, getProductKronan, getProductNetto } from "@/util/maps";

// React component to render the HTML table
const Table = ({ dataArray, nameArray, classArray, nafn }: { dataArray: Array<Array<number>>, nameArray: Array<string>, classArray: Array<string>, nafn: string }) => {
	// console.log(classArray)
	return (
		<section>
			<h1>{nafn}</h1>
			<table>
				<thead>
					<tr>
						{nameArray.map((header, index) => (
							<th key={index} className={classArray[index]}>{header}</th>
						))}
					</tr>
				</thead>
				<tbody>
					{dataArray.map((row, rowIndex) => (
						<tr key={rowIndex}>
							{row.length > 1 && row.map((cell, cellIndex) => (
								<td key={cellIndex}>{cell}</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</section>
	);
};


export default async function Home() {
	const envkey = process.env.API_KEY
	// console.log(process.env.API_KEY)
	// const a = envkey && await getDistmatrix("Eggertsgata 34", "Skipholt 50", "driving", envkey,)
	// console.log(a)
	// var parser = new DOMParser();
	const vara = "Ali pepperoni"
	const heima = [{ gata: "Hagamelur", numer: 38, verslun: "Heima" }]
	const lengdarfylki: Array<Array<number>> = [];
	const timafylki: Array<Array<number>> = [];
	const nafnavigur: Array<string> = [];
	const klassavigur: Array<string> = [];
	if (envkey) {
		const nettoLocation = await getLocationNetto();
		const kronanLocation = await getLocationKronan();
		const locations = heima.concat(nettoLocation.concat(kronanLocation));
		await locations.forEach(async fra => {
			const lengdarvigur: Array<number> = [];
			const timavigur: Array<number> = []
			await locations.forEach(async (til, i) => {
				const gildi = await getDistmatrix(`${fra.gata}${' ' + fra.numer || ''}`, `${til.gata}${til.numer ? ' ' + til.numer : ''}`, "driving", envkey)
				gildi && (gildi?.distance?.value >= 0) && lengdarvigur.push(gildi?.distance?.value);
				gildi && (gildi?.distance?.value >= 0) && timavigur.push(gildi?.distance?.value);
				if (i === 0) {
					gildi && (gildi?.distance?.value >= 0) && nafnavigur.push(`${fra.gata}${fra.numer ? ' ' + fra.numer : ''}`) && klassavigur.push(fra.verslun)
				}
			}
			)
			lengdarfylki.push(lengdarvigur);
			timafylki.push(timavigur);
		}

		)
	}
	const nettoVara = await getProductNetto(vara)
	const kronanVara = await getProductKronan(vara)
	return (
		<main>
			<h1>{vara}</h1>
			<Table dataArray={[[nettoVara.verd, kronanVara.verd]]} nameArray={["Nettó", "Krónan"]} classArray={[nettoVara.verslun, kronanVara.verlsun]} nafn="Verð" />
			<Table dataArray={lengdarfylki} nameArray={nafnavigur} classArray={klassavigur} nafn="lengdartafla" />
			<Table dataArray={timafylki} nameArray={nafnavigur} classArray={klassavigur} nafn="tímatafla" />
		</main>
	);
}
