import { ExtractionRule } from './types';

// The order here determines the column order in the grid/Excel
export const EXTRACTION_RULES: ExtractionRule[] = [
  // 1
  { key: 'matrah_toplam', label: 'Matrah Toplamı', searchPhrases: ['Matrah Toplamı'], type: 'standard' },
  // 2
  { key: 'hesaplanan_kdv', label: 'Hesaplanan Katma Değer Vergisi', searchPhrases: ['Hesaplanan Katma Değer Vergisi', 'Hesaplanan KDV'], type: 'standard' },
  // 3
  { key: 'ilave_kdv', label: 'Daha Önce İndirim Konusu Yapılan KDV\'nin İlavesi', searchPhrases: ['Daha Önce İndirim Konusu Yapılan KDV'], type: 'standard' },
  // 4
  { key: 'toplam_kdv', label: 'Toplam Katma Değer Vergisi', searchPhrases: ['Toplam Katma Değer Vergisi'], type: 'standard' },
  // 5
  { key: 'onceki_devreden', label: 'Önceki Dönemden Devreden İndirilecek KDV', searchPhrases: ['Önceki Dönemden Devreden İndirilecek KDV', 'Önceki Dönemden Devreden KDV'], type: 'standard' },
  // 6
  { key: 'yurtici_alis', label: 'Yurtiçi Alımlara İlişkin KDV', searchPhrases: ['Yurtiçi Alımlara İlişkin KDV'], type: 'standard' },
  // 7
  { key: 'sorumlu_kdv', label: 'Sorumlu Sıfatıyla Beyan Edilen KDV', searchPhrases: ['Sorumlu Sıfatıyla Beyan Edilen KDV'], type: 'standard' },
  // 8
  { key: 'ithalde_odenen', label: 'İthalde Ödenen KDV', searchPhrases: ['İthalde Ödenen KDV'], type: 'standard' },
  // 9
  { key: 'indirimler_toplam', label: 'İndirimler Toplamı', searchPhrases: ['İndirimler Toplamı'], type: 'standard' },
  // 10
  { key: 'tecil_edilecek', label: 'Tecil Edilecek Katma Değer Vergisi', searchPhrases: ['Tecil Edilecek Katma Değer Vergisi'], type: 'standard' },
  // 11
  { key: 'odenmesi_gereken', label: 'Ödenmesi Gereken Katma Değer Vergisi', searchPhrases: ['Ödenmesi Gereken Katma Değer Vergisi'], type: 'standard' },
  // 12
  { key: 'iade_edilmesi_gereken', label: 'İade Edilmesi Gereken Katma Değer Vergisi', searchPhrases: ['İade Edilmesi Gereken Katma Değer Vergisi'], type: 'standard' },
  // 13
  { key: 'sonraki_doneme_devreden', label: 'Sonraki Döneme Devreden Katma Değer Vergisi', searchPhrases: ['Sonraki Döneme Devreden Katma Değer Vergisi', 'Sonraki Döneme Devreden KDV'], type: 'standard' },
  // 14
  { key: 'teslim_hizmet_bedel', label: 'Teslim ve Hizmetlerin Karşılığını Teşkil Eden Bedel (aylık)', searchPhrases: ['Teslim ve Hizmetlerin Karşılığını Teşkil Eden Bedel', 'Teşkil Eden Bedel (aylık)'], type: 'standard' },
];