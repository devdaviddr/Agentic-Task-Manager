interface PageHeaderProps {
  title: string;
  children?: React.ReactNode;
}

export default function PageHeader({ title, children }: PageHeaderProps) {

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-lg font-bold text-heading">{title}</h1>
      {children}
    </div>
  );
}