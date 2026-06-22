export type CountryOption = {
  code: string
  name: string
  flag: string
}

function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
}

const COUNTRY_DATA: Array<[string, string]> = [
  ['ES', 'España'],
  ['MX', 'México'],
  ['AR', 'Argentina'],
  ['CO', 'Colombia'],
  ['CL', 'Chile'],
  ['PE', 'Perú'],
  ['EC', 'Ecuador'],
  ['VE', 'Venezuela'],
  ['UY', 'Uruguay'],
  ['PY', 'Paraguay'],
  ['BO', 'Bolivia'],
  ['CR', 'Costa Rica'],
  ['PA', 'Panamá'],
  ['DO', 'República Dominicana'],
  ['GT', 'Guatemala'],
  ['HN', 'Honduras'],
  ['NI', 'Nicaragua'],
  ['SV', 'El Salvador'],
  ['CU', 'Cuba'],
  ['PR', 'Puerto Rico'],
  ['US', 'Estados Unidos'],
  ['CA', 'Canadá'],
  ['BR', 'Brasil'],
  ['PT', 'Portugal'],
  ['FR', 'Francia'],
  ['DE', 'Alemania'],
  ['IT', 'Italia'],
  ['GB', 'Reino Unido'],
  ['IE', 'Irlanda'],
  ['NL', 'Países Bajos'],
  ['BE', 'Bélgica'],
  ['CH', 'Suiza'],
  ['AT', 'Austria'],
  ['SE', 'Suecia'],
  ['NO', 'Noruega'],
  ['DK', 'Dinamarca'],
  ['FI', 'Finlandia'],
  ['PL', 'Polonia'],
  ['RO', 'Rumanía'],
  ['GR', 'Grecia'],
  ['TR', 'Turquía'],
  ['RU', 'Rusia'],
  ['UA', 'Ucrania'],
  ['IL', 'Israel'],
  ['AE', 'Emiratos Árabes Unidos'],
  ['SA', 'Arabia Saudita'],
  ['QA', 'Catar'],
  ['IN', 'India'],
  ['CN', 'China'],
  ['JP', 'Japón'],
  ['KR', 'Corea del Sur'],
  ['AU', 'Australia'],
  ['NZ', 'Nueva Zelanda'],
  ['ZA', 'Sudáfrica'],
  ['MA', 'Marruecos'],
  ['EG', 'Egipto'],
  ['NG', 'Nigeria'],
  ['KE', 'Kenia'],
]

export const COUNTRY_OPTIONS: CountryOption[] = COUNTRY_DATA.map(([code, name]) => ({
  code,
  name,
  flag: countryFlag(code),
}))

export function findCountryByCode(code: string): CountryOption | undefined {
  const normalized = code.trim().toUpperCase()
  return COUNTRY_OPTIONS.find((country) => country.code === normalized)
}
