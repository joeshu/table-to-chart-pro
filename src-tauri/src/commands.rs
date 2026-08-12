use base64::{engine::general_purpose::STANDARD, Engine as _};
use std::{fs, path::PathBuf};

#[tauri::command]
pub fn read_text_file(path: String) -> Result<String, String> {
    fs::read_to_string(PathBuf::from(path)).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn write_text_file(path: String, contents: String) -> Result<(), String> {
    fs::write(PathBuf::from(path), contents).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn write_base64_file(path: String, contents: String) -> Result<(), String> {
    let payload = contents.split_once(',').map(|(_, data)| data).unwrap_or(&contents);
    let bytes = STANDARD.decode(payload).map_err(|error| error.to_string())?;
    fs::write(PathBuf::from(path), bytes).map_err(|error| error.to_string())
}
