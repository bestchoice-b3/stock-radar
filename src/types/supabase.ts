export type Indicator = {
  id: number;
  ticker: string;
  image_mt5: string | null;
  data_mt5: {
    ma9?: {
      prev?: number;
      value?: number;
      period?: number;
      applied?: string;
      timeframe?: string;
    };
    meta?: {
      sent_at?: string;
      local_time?: string;
      server_time?: string;
    };
    price?: {
      ask?: number;
      bid?: number;
      vs_ma9?: string;
      distance_pct?: number;
    };
    m9_signal?: string;
    volumeMoveAverage?: {
      signal?: "HIGH_VOLUME" | "LOW_VOLUME" | string;
      volume_ma?: number;
      volume_real?: number;
      volume_ratio?: number;
    };
  } | null;
  data_shark: {
    generated_at: string;
    items: {
      acionista: string;
      participacao: string;
    }[];
  } | null;
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
      date: string;
      valor: number;
      quantidade: number;
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
  data_sharks: {
    shark_name: string;
    quantity: number;
    items: string[];
  }[] | null;
} | null;

export type Note = {
  id: number;
  created_at: string;
  ticker: string;
  comment: string;
  user_id: string;
  importance: number;
};

export type Wallet = {
  id: number;
  created_at: string;
  ticker: string;
  user_id: string;
};

export type Todo = {
  id: number;
  created_at: string;
  ticker: string;
  operation: string;
  note: string | null;
  user_id: string;
};

export type TickerRow = {
  id: number;
  created_at: string;
  ticker: string;
};
