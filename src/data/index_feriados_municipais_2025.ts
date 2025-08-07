import { Feriado } from '@/types';
import { feriadosMunicipaisParte1_2025 } from './feriados_municipais_2025_parte1';
import { feriadosMunicipaisParte2_2025 } from './feriados_municipais_2025_parte2';
import { feriadosMunicipaisParte3_2025 } from './feriados_municipais_2025_parte3';

export const feriadosMunicipais2025: Feriado[] = [
  ...feriadosMunicipaisParte1_2025,
  ...feriadosMunicipaisParte2_2025,
  ...feriadosMunicipaisParte3_2025,
];