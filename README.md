# Server_postgres
http://localhost:4000/api/accounts → trả JSON danh sách account (20 dòng đầu tiên).

http://localhost:4000/api/projects → danh sách project.

http://localhost:4000/api/tasks → danh sách task.

http://localhost:4000/api/typeofworks → danh sách typeofWorks.

======================================================================================

## Lưu ý: tránh dùng port 3000 trùng với backend server presign URL của MinIO

======================================================================================

### Lỗi: 
            [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file:///.../server.js is not specified and it doesn't parse as CommonJS.
            Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
            To eliminate this warning, add "type": "module" to C:\Users\admin\my-backend\package.json.

### Nguyên nhân: 
            Bạn đang viết code bằng ESM (ES Module) (import express from "express";), nhưng package.json của project chưa khai báo "type": "module".

            Node.js vì vậy phải tự động detect → chạy được nhưng cảnh báo hiệu năng.

### Fix: 
            {
            "name": "my-backend",
            "version": "1.0.0",
            "type": "module",   <-- thêm dòng này
            "main": "server.js",
            "dependencies": {
                "express": "^4.19.2",
                "pg": "^8.11.5",
                "cors": "^2.8.5"
            }
            }


======================================================================================


### Lỗi:        
            Cannot GET /

### Nguyên nhân: 
            Backend của bạn chưa định nghĩa route gốc /

### Fix: 
            Muốn vào http://localhost:4000/ mà không lỗi thì thêm route test:

            app.get("/", (req, res) => {
            res.send("Backend API is running...");
            });
======================================================================================


### Lỗi: 
            DB error khi vào /api/accounts

### Nguyên nhân:
            Trong server.js bạn đang bật:
            ssl: { rejectUnauthorized: false }
            Nhưng Postgres server của bạn (raitek.cloud:5432) không hỗ trợ SSL, nên kết nối bị từ chối.
            
### Fix:
            Chỉ cần bỏ cấu hình SSL đi.
            Sửa lại Pool config thành:

            const pool = new Pool({
            host: "raitek.cloud",
            port: 5432,
            user: "mtryha11",
            password: "Hpx21led",
            database: "IOTdev"
            // ❌ bỏ ssl
            });
            
            OR
            
            const pool = new Pool({
            host: "raitek.cloud",
            port: 5432,
            user: "mtryha11",
            password: "Hpx21led",
            database: "IOTdev",
            ssl: false  // ✅ buộc không dùng SSL
            });
