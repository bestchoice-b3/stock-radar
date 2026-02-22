export type Indicator = {
  id: number;
  ticker: string;
  image_mt5: string | null;
  data_obv: {
    trajectory: 'ascendente' | 'descendente';
  } | null;
  data_adx: {
    plus_di_signal: boolean;
    minus_di_signal: boolean;
  } | null;
};
