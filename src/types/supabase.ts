export type Indicator = {
  id: number;
  ticker: string;
  image_mt5: string | null;
  data_obv: {
    trajectory: 'ascendente' | 'descendente';
  } | null;
  data_adx: {
    ticker?: string;
    timeframe?: string;
    values: {
      plus_di_signal: boolean;
      minus_di_signal: boolean;
    };
  } | null;
  data_insiders: {
    items: {
      quantidade: number;
      date: string;
      valor: number;
    }[];
  } | null;
  data_indicators: {
    generated_at?: string;
    items: {
      dy: number | null;
      pl: number | null;
      m_liquida: number | null;
      pl_historico: {
        media: number | null;
      } | null;
      max_52_semanas: number | null;
    }[];
  } | null;
  data_peaks_valleys: {
    signal_sell: boolean;
    signal_buy: boolean;
    price_current: number | null;
    params?: any;
    timeframe?: string;
  } | null;
};

export type IndicatorsCommonData = {
  data_volume: {
    items: {
      [ticker: string]: {
        site: string;
        tipo: string;
        close: number;
        source: string;
        ticker: string;
        // fields from user request
        change: number;
        volume_change?: number;
        recommendation_mark?: string;
        average_volume_30d?: number;
        average_volume_10d?: number;
        volume?: number;
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
        posicao_ranking?: number;
        classificacao?: string;
      };
    };
  } | null;
} | null;

export type Note = {
  id: number;
  created_at: string;
  ticker: string;
  comment: string;
  user_id: string;
  importance: number;
};
