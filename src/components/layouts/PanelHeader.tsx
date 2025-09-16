type Props = { title: string; subtitle?: React.ReactNode }
export function PanelHeader({ title, subtitle }: Props) {
  return (
    <header className="text-center space-y-2">
      <h2>{title}</h2>
      {subtitle ? (
        <p className="text-sm text-content-3">{subtitle}</p>
      ) : null}
    </header>
  )
}
