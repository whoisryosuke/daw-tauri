use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

#[derive(Clone, Serialize, Deserialize)]
pub enum NotificationType {
    Default,
    Error,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct Notification {
    title: String,
    description: String,
    variant: NotificationType,
}

impl Notification {
    pub fn new(title: String, description: String, variant: NotificationType) -> Self {
        Self {
            title,
            description,
            variant,
        }
    }
}

/// Sends a notification to frontend.
pub fn send_notification(
    app: AppHandle,
    title: String,
    description: String,
    variant: NotificationType,
) {
    let notification = Notification::new(title, description, variant);
    let _ = app.emit("notification", notification);
}
