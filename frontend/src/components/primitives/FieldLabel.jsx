import PropTypes from 'prop-types';

import { Tooltip } from './Tooltip.jsx';

export const FieldLabel = ({
  label,
  htmlFor = '',
  id = '',
  title = '',
  body = '',
  example = '',
  preview = '',
  className = ''
}) => {
  const hasHelp = Boolean(title || body || example || preview);
  const labelClassName = `field-label${className ? ` ${className}` : ''}`;

  return (
    <span className={labelClassName}>
      {htmlFor ? (
        <label htmlFor={htmlFor} id={id || undefined} className="field-label__text">
          {label}
        </label>
      ) : (
        <span id={id || undefined} className="field-label__text">
          {label}
        </span>
      )}
      {hasHelp ? (
        <Tooltip
          label={`Ayuda sobre ${label}`}
          title={title}
          body={body}
          example={example}
          preview={preview}
          triggerClassName="field-label__help"
        />
      ) : null}
    </span>
  );
};

FieldLabel.propTypes = {
  label: PropTypes.string.isRequired,
  htmlFor: PropTypes.string,
  id: PropTypes.string,
  title: PropTypes.string,
  body: PropTypes.string,
  example: PropTypes.string,
  preview: PropTypes.string,
  className: PropTypes.string
};
