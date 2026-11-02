type BaseLabelProps = {
  message?: string;
};

export const BaseErrorMessage = ({ message }: BaseLabelProps) => {
  if (message) return <p className="text-sm text-red-600">{message}</p>;
};
