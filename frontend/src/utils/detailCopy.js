const SEED_MARKER_PATTERN = /\[seed_[^\]]+\]\s*/gi;
const WHITESPACE_PATTERN = /\s+/g;
const DIACRITIC_PATTERN = /[\u0300-\u036f]/g;

const collapseWhitespace = (value) => value.replace(WHITESPACE_PATTERN, ' ').trim();

const normalizeCopy = (value) => (
  collapseWhitespace(value)
    .normalize('NFD')
    .replace(DIACRITIC_PATTERN, '')
    .toLowerCase()
);

export const stripSeedMarkerCopy = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return collapseWhitespace(value.replace(SEED_MARKER_PATTERN, ''));
};

export const getVisibleTicketSummary = (value) => {
  const cleanedCopy = stripSeedMarkerCopy(value);
  const normalizedCopy = normalizeCopy(cleanedCopy);

  if (!cleanedCopy) {
    return '';
  }

  if (normalizedCopy.startsWith('caso operativo generado para pruebas de paginacion y pipeline.')) {
    return '';
  }

  return cleanedCopy;
};

export const getVisibleAssetDescription = (value) => {
  const cleanedCopy = stripSeedMarkerCopy(value);
  const normalizedCopy = normalizeCopy(cleanedCopy);

  if (!cleanedCopy) {
    return '';
  }

  if (normalizedCopy === 'activo raiz para maquetacion de access.' || normalizedCopy === 'activo raiz para maquetacion de access') {
    return '';
  }

  return cleanedCopy;
};
