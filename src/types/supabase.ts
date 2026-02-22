export type Indicator = {
  id: number;
  ticker: string;
  image_mt5: string | null;
  data_obv: {
    trajectory: 'ascendente' | 'descendente';
  } | null;
};
