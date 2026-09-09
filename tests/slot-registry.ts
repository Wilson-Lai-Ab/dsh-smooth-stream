/**
 * Node-loadable SlotRegistry for tests. The published
 * `@deepseek-ai/dsh-client-runtime/client` bundle is a browser ModuleLoader
 * factory and cannot run under vitest.
 */
import { Service, type Context } from '@deepseek-ai/cordis'
import { SlotCore } from '@deepseek-ai/dsh-client-ui-slots'

type SlotEffect = (() => void) | Iterable<() => void> | void

function disposeEffect(effect: SlotEffect): void {
  if (typeof effect === 'function') {
    effect()
    return
  }
  if (effect === undefined) return
  for (const disposer of [...effect].reverse()) disposer()
}

/** Cordis service providing `ctx.slots` over the pure SlotCore. */
export class SlotRegistry extends Service {
  private readonly core = new SlotCore()

  constructor(ctx: Context) {
    super(ctx, 'slots')
    ctx.effect(() => this.core.onMutate((key) => {
      ctx.emit('slots/changed', key)
    }))
  }

  register(options: object, component: unknown): () => void {
    return this.core.register(options as never, component as never)
  }

  entries(key: string) {
    return this.core.entries(key)
  }

  inject(key: string, callback: () => SlotEffect): () => void {
    return this.ctx.effect(() => {
      let running = false
      let active: SlotEffect
      const start = (): void => {
        if (running) return
        if (this.core.specDynamic(key) === undefined) return
        running = true
        active = callback()
      }
      const stop = (): void => {
        if (!running) return
        running = false
        disposeEffect(active)
        active = undefined
      }
      if (this.core.declarationEpoch(key) > 0) start()
      const off = this.core.subscribeDeclaration(key, () => {
        if (this.core.declarationEpoch(key) > 0) start()
        else stop()
      })
      return () => {
        off()
        stop()
      }
    })
  }
}
