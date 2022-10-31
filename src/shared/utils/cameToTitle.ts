export const camelToTitle = (camelString: string) => {
  return camelString
    .split(/(?<!(^|[A-Z]))(?=[A-Z])|(?<!^)(?=[A-Z][a-z])/)
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ''))
    .join(' ');
};
