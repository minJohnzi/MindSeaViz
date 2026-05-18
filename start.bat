@echo off
title MindSeaViz
echo ================================
echo   MindSeaViz — 启动中...
echo ================================
echo.

cd /d "%~dp0"

:: 检查 .env
if not exist ".env" (
    echo [警告] .env 文件不存在，聊天功能需要 ANTHROPIC_API_KEY
    echo 请复制 .env.example 为 .env 并填入你的 API Key
    echo.
)

:: 启动后端 (后台)
echo [1/3] 启动后端服务 (8001)...
start "MindSeaViz Backend" /MIN cmd /c "cd /d %~dp0 && uvicorn main:app --host 127.0.0.1 --port 8001"

:: 等待后端就绪
echo [2/3] 等待后端就绪...
:wait
timeout /t 1 /nobreak >nul
curl -s http://127.0.0.1:8001/api/health >nul 2>&1
if errorlevel 1 goto wait
echo       后端已就绪 ^(http://127.0.0.1:8001^)

:: 启动前端
echo [3/3] 启动前端服务 (5173)...
cd frontend
start "MindSeaViz Frontend" /MIN cmd /c "cd /d %~dp0frontend && npx vite --host 127.0.0.1 --port 5173"

:: 等待前端就绪
:wait2
timeout /t 1 /nobreak >nul
curl -s http://127.0.0.1:5173 >nul 2>&1
if errorlevel 1 goto wait2
echo       前端已就绪 ^(http://127.0.0.1:5173^)

:: 打开浏览器
echo.
echo ================================
echo   启动完成，打开浏览器...
echo ================================
start http://127.0.0.1:5173

echo.
echo 按任意键停止所有服务...
pause >nul

:: 清理
taskkill /FI "WINDOWTITLE eq MindSeaViz Backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq MindSeaViz Frontend*" /T /F >nul 2>&1
echo 服务已停止
