import { Feriado } from '@/types';
import { feriadosMunicipaisParte1_2025, feriadosMunicipaisParte2_2025, feriadosMunicipaisParte3_2025 } from './feriados_municipais_2025_vazio';

export const feriadosMunicipais2025: Feriado[] = [
  ...feriadosMunicipaisParte1_2025,
  ...feriadosMunicipaisParte2_2025,
  ...feriadosMunicipaisParte3_2025,
];