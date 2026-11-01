export const createSSEParser = (onData) => {
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  const dispatch = (eventText) => {
    const dataLines = [];

    for (const line of eventText.split(/\r\n|\n|\r/)) {
      if (!line || line.startsWith(':')) continue;

      const separator = line.indexOf(':');
      const field = separator === -1 ? line : line.slice(0, separator);
      if (field !== 'data') continue;

      let value = separator === -1 ? '' : line.slice(separator + 1);
      if (value.startsWith(' ')) value = value.slice(1);
      dataLines.push(value);
    }

    if (dataLines.length) onData(dataLines.join('\n'));
  };

  const processCompleteEvents = () => {
    const separator = /(?:\r\n|\n|\r){2}/;
    let match = separator.exec(buffer);

    while (match) {
      dispatch(buffer.slice(0, match.index));
      buffer = buffer.slice(match.index + match[0].length);
      match = separator.exec(buffer);
    }
  };

  return {
    push(bytes) {
      buffer += decoder.decode(bytes, { stream: true });
      processCompleteEvents();
    },
    finish() {
      buffer += decoder.decode();
      processCompleteEvents();
      if (buffer) dispatch(buffer);
      buffer = '';
    },
  };
};