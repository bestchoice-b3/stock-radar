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

export type IndicatorsCommonData = {
  data_volume: {
    items: {
      [ticker: string]: {
        site: string;
        tipo: string;
        close: number;
        change: number;
        source: string;
        ticker: string;
      };
    };
  } | null;
  data_magic_formula: {
    items: {
      [ticker: string]: {
        eps: number;
        name: string;
        roic: number;
        site: string;
        price: number;
        source: string;
        symbol: string;
        ticker: string;
        ev_ebit: number;
      };
    };
  } | null;
} | null;
