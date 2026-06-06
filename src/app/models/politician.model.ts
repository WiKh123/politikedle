export type Party =
  | 'CDU' | 'CSU' | 'SPD' | 'Grüne' | 'FDP'
  | 'AfD' | 'Linke' | 'BSW' | 'parteilos';

export type GermanState =
  | 'Baden-Württemberg' | 'Bayern' | 'Berlin' | 'Brandenburg'
  | 'Bremen' | 'Hamburg' | 'Hessen' | 'Mecklenburg-Vorpommern'
  | 'Niedersachsen' | 'Nordrhein-Westfalen' | 'Rheinland-Pfalz'
  | 'Saarland' | 'Sachsen' | 'Sachsen-Anhalt' | 'Schleswig-Holstein'
  | 'Thüringen';

export type PositionLevel =
  | 'Bundeskanzler/in'
  | 'Bundespräsident/in'
  | 'Bundesminister/in'
  | 'Ministerpräsident/in'
  | 'Bundestagspräsident/in'
  | 'Parteivorsitzende/r'
  | 'MdB / Fraktionsvorsitzende/r';

export type Gender = 'männlich' | 'weiblich';

export interface Politician {
  id: string;
  name: string;
  party: Party;
  state: GermanState;
  position: PositionLevel;
  birthYear: number;
  gender: Gender;
  quote?: string;
}

export type CompareResult = 'correct' | 'partial' | 'wrong';

export interface GuessComparison {
  politician: Politician;
  party: CompareResult;
  state: CompareResult;
  stateRegion: string;
  position: CompareResult;
  birthYear: CompareResult;
  birthYearDirection: 'higher' | 'lower' | 'exact';
  birthYearDiff: number;
  gender: CompareResult;
  isCorrect: boolean;
}

export const PARTY_FAMILY: Record<Party, string> = {
  'Linke': 'links',
  'BSW': 'links',
  'SPD': 'mitte-links',
  'Grüne': 'mitte-links',
  'FDP': 'mitte',
  'CDU': 'mitte-rechts',
  'CSU': 'mitte-rechts',
  'AfD': 'rechts',
  'parteilos': 'parteilos',
};

export const STATE_REGION: Record<GermanState, string> = {
  'Hamburg': 'Nord',
  'Bremen': 'Nord',
  'Schleswig-Holstein': 'Nord',
  'Niedersachsen': 'Nord',
  'Mecklenburg-Vorpommern': 'Nord',
  'Nordrhein-Westfalen': 'West',
  'Rheinland-Pfalz': 'West',
  'Saarland': 'West',
  'Hessen': 'West',
  'Bayern': 'Süd',
  'Baden-Württemberg': 'Süd',
  'Berlin': 'Ost',
  'Brandenburg': 'Ost',
  'Sachsen': 'Ost',
  'Sachsen-Anhalt': 'Ost',
  'Thüringen': 'Ost',
};

export const POSITION_LEVEL_GROUP: Record<PositionLevel, string> = {
  'Bundeskanzler/in': 'Kanzleramt',
  'Bundespräsident/in': 'Staatsoberhaupt',
  'Bundesminister/in': 'Bundesregierung',
  'Ministerpräsident/in': 'Exekutive Land',
  'Bundestagspräsident/in': 'Legislative Bund',
  'MdB / Fraktionsvorsitzende/r': 'Legislative Bund',
  'Parteivorsitzende/r': 'Parteiführung',
};
