import * as React from "react"

export const AvatarContext = React.createContext<{ src?: string; hasLoaded: boolean; setHasLoaded: (val: boolean) => void }>({
  hasLoaded: false,
  setHasLoaded: () => {},
})

export const Avatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => {
    const [hasLoaded, setHasLoaded] = React.useState(false)

    return (
      <AvatarContext.Provider value={{ hasLoaded, setHasLoaded }}>
        <div
          ref={ref}
          className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-surface border border-border ${className}`}
          {...props}
        >
          {children}
        </div>
      </AvatarContext.Provider>
    )
  }
)
Avatar.displayName = "Avatar"

export const AvatarImage = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
  ({ className = "", src, onLoad, onError, ...props }, ref) => {
    const context = React.useContext(AvatarContext)

    React.useEffect(() => {
      if (src) {
        const img = new Image()
        img.src = src
        img.onload = () => context.setHasLoaded(true)
        img.onerror = () => context.setHasLoaded(false)
      }
    }, [src])

    if (!src || !context.hasLoaded) {
      return null
    }

    return (
      <img
        ref={ref}
        src={src}
        className={`aspect-square h-full w-full object-cover ${className}`}
        {...props}
      />
    )
  }
)
AvatarImage.displayName = "AvatarImage"

export const AvatarFallback = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => {
    const context = React.useContext(AvatarContext)

    if (context.hasLoaded) {
      return null
    }

    return (
      <div
        ref={ref}
        className={`flex h-full w-full items-center justify-center rounded-full bg-surface text-primary font-medium text-xs ${className}`}
        {...props}
      />
    )
  }
)
AvatarFallback.displayName = "AvatarFallback"
