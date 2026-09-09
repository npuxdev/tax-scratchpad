import { toast } from '@noorddev/vlak-react'

export function downloadJsonFile(filename: string, json: string): void {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function scenarioDownloadName(name: string): string {
  const safe = name.replace(/[^\w.-]+/g, '-').toLowerCase()
  return `${safe || 'scenario'}.json`
}

export async function readImportedFile(
  file: File,
  importScenario: (json: string, regenerateIds?: boolean) => Promise<void>,
): Promise<void> {
  try {
    const text = await file.text()
    await importScenario(text, true)
    toast('Imported scenario')
  } catch (err) {
    toast('Import failed', {
      description: err instanceof Error ? err.message : 'Invalid file',
    })
  }
}
