import config from "../../../../../ipconfig.js";
window.addEventListener("load", () => {
    const token = localStorage.getItem("Authorization_M"); // 使用Manager Token
    //錯誤顯示用
    const errorDiv = document.getElementById("error");

    // 一進入頁面呼叫
    fetchAndBuildTable();

    // 撈所有預約單 for Manager
    function fetchAndBuildTable() {
        fetch(config.url + `/manager/findAllLeave`, {
            method: "GET",
            headers: {
                Authorization_M: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwiZXhwIjoxNjkzNzM0ODgzfQ.MGVymnvxKaRZ9N7gGInQitt7q_zVoHxvt2n7hoPws6A", // 使用Manager Token
                "Content-Type": "application/json"
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.code === 200) {
                    errorDiv.innerHTML = "";
                    const rs = data.message;

                    buildTable(rs);
                } else if (data.code === 401) {
                    let errorLabel = document.createElement("label");
                    errorLabel.innerHTML = `身分${data.message}`;
                    errorLabel.style.color = "red";
                    errorLabel.style.font = "16px Arial, sans-serif";
                    errorDiv.appendChild(errorLabel);
                } else {
                    let errorLabel = document.createElement("label");
                    errorLabel.innerHTML = `${data.message}`;
                    errorLabel.style.color = "red";
                    errorLabel.style.font = "16px Arial, sans-serif";
                    errorDiv.appendChild(errorLabel);
                }
            });
    }

    //建構表格
    function buildTable(data) {

        const table = $('.table-fill').DataTable({
            id: 'myTable',
            data: data,
            columns: [
                { data: 'leaveNo' },
                { data: 'pgId' },
                { data: 'pgName' },
                { data: 'leaveCreated' },
                { data: 'leaveDate' },
                {
                    data: 'leaveTime', // Use the leaveTime property
                    render: function (data) {
                        const timeSlots = data.split('').map((digit, index) => {
                            const hour = index.toString().padStart(2, '0'); // Add hour markers
                            const status = digit === '0' ? '出勤' : '休';
                            return { hour, status };
                        });

                        const rows = [];
                        for (let i = 0; i < timeSlots.length; i += 4) {
                            const slotsRow = timeSlots.slice(i, i + 4).map(slot => {
                                const statusClass = slot.status === '出勤' ? 'btn-success' : 'btn-danger';
                                return `<button class="btn ${statusClass} time-slot">${slot.hour}點${slot.status}</button>`;
                            }).join('');
                            rows.push(slotsRow);
                        }

                        return rows.join('<br>'); // Display rows with line breaks
                    }
                },
                { data: 'leaveState' },
                {
                    data: null,
                    render: function (data, type, row) {
                        return `<button class="btn slot-button finish" data-leaveNo="${row.leaveNo}" value="1">通過</button>`;
                    }
                },
                {
                    data: null,
                    render: function (data, type, row) {
                        return `<button class="btn slot-button cancel" data-leaveNo="${row.leaveNo}" value="2">取消</button>`;
                    }
                }
            ],
            order: [[0, 'asc']], // 預設按 leaveCreated 欄位降序排列
            paging: true,
            searching: true,
            info: true,
            language: {
                url: "https://cdn.datatables.net/plug-ins/1.13.6/i18n/zh-HANT.json"
            }
        });
        $('.table-container').css('overflow-x', 'auto');
        $('.table-fill tbody').on('click', '.finish', function (event) {
            const leaveNo = $(event.target).attr('data-leaveNo');
            const action = $(event.target).val();
            changeLeave(leaveNo, action);
            // 執行批准假單的函數
        });

        $('.table-fill tbody').on('click', '.cancel', function (event) {
            const leaveNo = $(event.target).attr('data-leaveNo');
            const action = $(event.target).val();
            changeLeave(leaveNo, action);
            // 執行取消假單的函數
        });
    }



    //審核假單
    function changeLeave(leaveNo, leaveState) {
        const requestBody = {
            leaveNo: parseInt(leaveNo),
            leaveState: parseInt(leaveState)
        };
        //TOKEN要修改
        fetch(config.url + "/manager/changeLeave", {
            method: "POST",
            headers: {
                Authorization_M: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwiZXhwIjoxNjkzNjM0ODE5fQ.qMvo_LrPZp3-za4HCjjMhUX8b_mHXSIuNATPM9Ke83c",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        })
            .then(response => response.json())
            .then(data => {
                if (data.code === 200) {
                    Swal.fire({
                        icon: "success",
                        title: "假單審核成功",
                        text: data.message
                    });
                    if (dataTableInstance) {
                        dataTableInstance.destroy();
                    }
                    fetchAndBuildTable();
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "假單審核失敗",
                        text: data.message
                    });
                }
            });
    }

});
