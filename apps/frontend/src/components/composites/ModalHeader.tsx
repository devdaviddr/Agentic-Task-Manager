import Button from '../ui/Button'

interface ModalHeaderProps {
  title: string
  onClose: () => void
}

export default function ModalHeader({ title, onClose }: ModalHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-semibold text-heading">{title}</h2>
      <Button variant="icon" onClick={onClose} className="text-muted hover:text-body p-1">
        ✕
      </Button>
    </div>
  )
}