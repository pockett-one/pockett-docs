type GTagEvent = {
    action: string
    category?: string
    label?: string
    value?: number
    [key: string]: any
}

export const sendEvent = ({ action, category, label, value, ...props }: GTagEvent) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
        ; (window as any).gtag('event', action, {
            event_category: category,
            event_label: label,
            value: value,
            ...props,
        })
    } else {
        // Debug mode or dev environment fallbacks could go here
        if (process.env.NODE_ENV === 'development') {
            console.log('Anaytics Event:', { action, category, label, value, ...props })
        }
    }
}

export const ANALYTICS_EVENTS = {
    CONTACT_SUBMIT: 'contact_submit',
    SIGN_UP: 'sign_up',
    LOGIN: 'login',
    ADD_CONNECTOR_START: 'add_connector_start',
    ADD_CONNECTOR_COMPLETE: 'add_connector_complete',
}
