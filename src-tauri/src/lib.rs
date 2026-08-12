mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            commands::read_text_file,
            commands::write_text_file,
            commands::write_base64_file,
            commands::import_spreadsheet,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
