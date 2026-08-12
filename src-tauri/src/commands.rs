use base64::{engine::general_purpose::STANDARD, Engine as _};
use calamine::{open_workbook_auto, Data, Reader};
use serde::Serialize;
use std::{fs, path::{Path, PathBuf}};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportedSheet { pub name: String, pub headers: Vec<String>, pub rows: Vec<Vec<String>> }

#[tauri::command]
pub fn read_text_file(path: String) -> Result<String, String> { fs::read_to_string(PathBuf::from(path)).map_err(|e| e.to_string()) }

#[tauri::command]
pub fn write_text_file(path: String, contents: String) -> Result<(), String> { fs::write(PathBuf::from(path), contents).map_err(|e| e.to_string()) }

#[tauri::command]
pub fn write_base64_file(path: String, contents: String) -> Result<(), String> {
    let payload=contents.split_once(',').map(|(_,data)|data).unwrap_or(&contents);
    let bytes=STANDARD.decode(payload).map_err(|e|e.to_string())?;
    fs::write(PathBuf::from(path),bytes).map_err(|e|e.to_string())
}

#[tauri::command]
pub fn startup_files() -> Vec<String> {
    std::env::args().skip(1).filter(|arg| is_supported_file(arg)).collect()
}

fn is_supported_file(path: &str) -> bool {
    matches!(Path::new(path).extension().and_then(|value| value.to_str()).map(str::to_lowercase).as_deref(), Some("t2c" | "json" | "xlsx" | "xls" | "xlsb" | "ods" | "csv" | "tsv" | "txt"))
}

#[tauri::command]
pub fn import_spreadsheet(path: String) -> Result<Vec<ImportedSheet>, String> {
    let file=Path::new(&path); let ext=file.extension().and_then(|v|v.to_str()).unwrap_or("").to_lowercase();
    match ext.as_str() { "xlsx"|"xls"|"xlsb"|"ods" => import_excel(file), "csv"|"tsv"|"txt" => import_delimited(file,&ext), _ => Err("不支持的表格文件格式".into()) }
}

fn import_excel(path:&Path)->Result<Vec<ImportedSheet>,String>{
    let mut workbook=open_workbook_auto(path).map_err(|e|e.to_string())?; let names=workbook.sheet_names().to_vec(); let mut sheets=Vec::new();
    for name in names { if let Ok(range)=workbook.worksheet_range(&name) { let matrix:Vec<Vec<String>>=range.rows().map(|row|row.iter().map(cell_string).collect()).collect(); if let Some(sheet)=matrix_to_sheet(name,matrix){sheets.push(sheet);} } }
    if sheets.is_empty(){Err("工作簿中没有可导入的数据".into())}else{Ok(sheets)}
}

fn import_delimited(path:&Path,ext:&str)->Result<Vec<ImportedSheet>,String>{
    let bytes=fs::read(path).map_err(|e|e.to_string())?; let delimiter=if ext=="tsv"{b'\t'}else{detect_delimiter(&bytes)};
    let mut reader=csv::ReaderBuilder::new().delimiter(delimiter).has_headers(false).flexible(true).from_reader(bytes.as_slice()); let mut matrix=Vec::new();
    for record in reader.records(){matrix.push(record.map_err(|e|e.to_string())?.iter().map(str::to_owned).collect());}
    matrix_to_sheet("数据".into(),matrix).map(|sheet|vec![sheet]).ok_or_else(||"文件中没有可导入的数据".into())
}

fn matrix_to_sheet(name:String,matrix:Vec<Vec<String>>)->Option<ImportedSheet>{
    let mut iter=matrix.into_iter().filter(|row|row.iter().any(|cell|!cell.trim().is_empty())); let mut headers=iter.next()?; let width=headers.len();
    for (i,header) in headers.iter_mut().enumerate(){if header.trim().is_empty(){*header=format!("列{}",i+1);}}
    let rows=iter.map(|mut row|{row.resize(width,String::new());row.truncate(width);row}).collect(); Some(ImportedSheet{name,headers,rows})
}

fn detect_delimiter(bytes:&[u8])->u8{let sample=&bytes[..bytes.len().min(4096)];[b',',b'\t',b';'].into_iter().max_by_key(|d|sample.iter().filter(|b|*b==d).count()).unwrap_or(b',')}
fn cell_string(cell:&Data)->String{match cell{Data::Empty=>String::new(),Data::String(v)=>v.clone(),Data::Float(v)=>{if v.fract()==0.0{format!("{v:.0}")}else{v.to_string()}},Data::Int(v)=>v.to_string(),Data::Bool(v)=>v.to_string(),Data::DateTime(v)=>v.to_string(),Data::DateTimeIso(v)=>v.clone(),Data::DurationIso(v)=>v.clone(),Data::Error(v)=>format!("#{v:?}")}}
