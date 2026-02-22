export type Indicator = {
  id: number;
  ticker: string;
  image_mt5: string | null;
  data_obv: {
    trajectory: 'ascendente' | 'descendente';
  } | null;
  data_adx: {
    values: {
      plus_di_signal: boolean;
      minus_di_signal: boolean;
    };
  } | null;
  data_insiders: {
    items: {
      quantidade: number;
    }[];
  } | null;
  data_indicators: {
    items: {
      dy: number | null;
      pl: number | null;
      m_liquida: number | null;
      pl_historico: {
        media: number | null;
      } | null;
    }[];
  } | null;
  data_peaks_valleys: {
    signal_sell: boolean;
    signal_buy: boolean;
  } | null;
};
