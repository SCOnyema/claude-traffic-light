use std::fs;
use std::path::PathBuf;

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager, PhysicalPosition,
};

/// Path to %USERPROFILE%\.claude-light\state.json
fn state_file_path() -> Option<PathBuf> {
    let home = std::env::var_os("USERPROFILE")?;
    Some(PathBuf::from(home).join(".claude-light").join("state.json"))
}

/// Create the state directory and a default "off" state file on first launch.
fn ensure_state_file() {
    let Some(path) = state_file_path() else { return };
    if let Some(dir) = path.parent() {
        let _ = fs::create_dir_all(dir);
    }
    if !path.exists() {
        let _ = fs::write(&path, r#"{"state":"off","ts":0}"#);
    }
}

/// Return the raw contents of state.json; the frontend parses it and applies
/// the idle rule. Polled by the UI every second.
#[tauri::command]
fn get_state() -> Result<String, String> {
    let path = state_file_path().ok_or("USERPROFILE not set")?;
    fs::read_to_string(path).map_err(|e| e.to_string())
}

/// Place the window at the top-right of the primary monitor with a 12px
/// (logical) margin.
fn position_top_right(window: &tauri::WebviewWindow) -> tauri::Result<()> {
    if let Some(monitor) = window.primary_monitor()? {
        let margin = (12.0 * monitor.scale_factor()).round() as i32;
        let m_pos = monitor.position();
        let m_size = monitor.size();
        let w_size = window.outer_size()?;
        let x = m_pos.x + m_size.width as i32 - w_size.width as i32 - margin;
        let y = m_pos.y + margin;
        window.set_position(PhysicalPosition::new(x, y))?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_state])
        .setup(|app| {
            ensure_state_file();

            if let Some(window) = app.get_webview_window("main") {
                let _ = position_top_right(&window);
            }

            let show_hide = MenuItem::with_id(app, "show_hide", "Show/Hide", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_hide, &quit])?;

            TrayIconBuilder::with_id("claude-light-tray")
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("claude-light")
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show_hide" => {
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
