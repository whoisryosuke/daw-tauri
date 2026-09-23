use uuid::Uuid;

pub fn generate_uuid() -> String {
    let id = Uuid::now_v7();
    id.to_string()
}
