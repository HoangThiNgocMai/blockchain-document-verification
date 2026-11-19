import { useState, useEffect } from "react";

import verificationLogApi from "../../api/verificationLogApi.js";
import organizationApi from "../../api/organizationApi.js";


import VerificationStatus from "../../components/VerificationStatus.jsx";
import VerificationDetail from "../../components/VerificationDetail.jsx";
import Pagination from "../../components/Pagination.jsx";

import "../../styles/verifications.css";


// ================================================
// 1. ĐỊNH DẠNG THỜI GIAN
// ================================================

function formatDate(value) {

  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });

}


// ================================================
// 2. TRANG QUẢN LÝ LỊCH SỬ XÁC THỰC
// ================================================

function Verifications() {

  const [verifications, setVerifications] = useState([]);

  const [selectedVerificationId, setSelectedVerificationId] =
  useState(null);

  const [organizations, setOrganizations] = useState([]);

  const [statistics, setStatistics] = useState(null);


  // TRẠNG THÁI TẢI DỮ LIỆU

  const [loading, setLoading] = useState(true);

  const [metadataLoading, setMetadataLoading] =
    useState(true);


  // THÔNG BÁO LỖI

  const [error, setError] = useState("");

  const [metadataError, setMetadataError] =
    useState("");

  const [filterError, setFilterError] =
    useState("");


  // TÌM KIẾM

  const [searchInput, setSearchInput] =
    useState("");

  const [search, setSearch] = useState("");


  // BỘ LỌC

  const [result, setResult] = useState("");

  const [organizationId, setOrganizationId] =
    useState("");


  // NGÀY NHẬP TRÊN GIAO DIỆN

  const [fromDateInput, setFromDateInput] =
    useState("");

  const [toDateInput, setToDateInput] =
    useState("");


  // NGÀY ĐÃ ÁP DỤNG

  const [fromDate, setFromDate] = useState("");

  const [toDate, setToDate] = useState("");


  // PHÂN TRANG

  const [page, setPage] = useState(1);

  const [limit, setLimit] = useState(10);

  const [refreshKey, setRefreshKey] = useState(0);


  const [pagination, setPagination] = useState({

    page: 1,

    limit: 10,

    total: 0,

    totalPages: 0,

  });


  // ==============================================
  // 3. LẤY THỐNG KÊ VÀ DANH SÁCH ĐƠN VỊ
  // ==============================================

  useEffect(() => {

    let cancelled = false;

    async function fetchMetadata() {

      try {

        const [statsResponse, orgResponse] =
          await Promise.all([

            verificationLogApi.getStatistics(),

            organizationApi.getAll(),

          ]);

        if (cancelled) return;


        if (

          !statsResponse.success ||

          !statsResponse.data ||

          !orgResponse.success ||

          !Array.isArray(orgResponse.data)

        ) {

          setMetadataError(
            "Dữ liệu thống kê hoặc đơn vị không hợp lệ."
          );

          return;

        }


        setStatistics(statsResponse.data);

        setOrganizations(orgResponse.data);

      } catch {

        if (!cancelled) {

          setMetadataError(
            "Không thể tải thống kê hoặc danh sách đơn vị."
          );

        }

      } finally {

        if (!cancelled) {

          setMetadataLoading(false);

        }

      }

    }


    fetchMetadata();

    return () => {

      cancelled = true;

    };

  }, [refreshKey]);


  // ==============================================
  // 4. LẤY DANH SÁCH LỊCH SỬ XÁC THỰC
  // ==============================================

  useEffect(() => {

    let cancelled = false;

    async function fetchVerifications() {

      let changingPage = false;

      try {

        const params = {

          search,

          result,

          fromDate,

          toDate,

          page,

          limit,

        };


        if (organizationId) {

          params.organizationId =
            Number(organizationId);

        }


        const response =
          await verificationLogApi.getAll(params);

        if (cancelled) return;


        if (

          !response.success ||

          !Array.isArray(response.data) ||

          !response.pagination

        ) {

          setError(
            "Dữ liệu lịch sử xác thực không hợp lệ."
          );

          return;

        }


        const paging = response.pagination;

        if (

          !Number.isSafeInteger(paging.total) ||

          paging.total < 0 ||

          !Number.isSafeInteger(paging.totalPages) ||

          paging.totalPages < 0 ||

          paging.page !== page ||

          paging.limit !== limit

        ) {

          setError(
            "Dữ liệu phân trang không hợp lệ."
          );

          return;

        }


        const lastPage = Math.max(
          1,
          paging.totalPages
        );


        if (page > lastPage) {

          changingPage = true;

          setPage(lastPage);

          return;

        }


        setVerifications(response.data);

        setPagination(paging);


      } catch (err) {

        if (cancelled) return;

        const code = err.response?.status;


        if (code === 400) {

          setError(
            "Tham số tìm kiếm hoặc bộ lọc không hợp lệ."
          );

        } else if (code === 401) {

          setError(
            "Phiên đăng nhập đã hết hạn."
          );

        } else if (code === 403) {

          setError(
            "Bạn không có quyền truy cập."
          );

        } else if (!err.response) {

          setError(
            "Không thể kết nối đến máy chủ."
          );

        } else {

          setError(
            "Không thể tải lịch sử xác thực."
          );

        }

      } finally {

        if (!cancelled && !changingPage) {

          setLoading(false);

        }

      }

    }


    fetchVerifications();


    return () => {

      cancelled = true;

    };

  }, [

    search,

    result,

    organizationId,

    fromDate,

    toDate,

    page,

    limit,

    refreshKey,

  ]);


  // ==============================================
  // 5. CHUẨN BỊ TẢI DỮ LIỆU
  // ==============================================

  function prepareLoading() {

    setLoading(true);

    setError("");

  }


  // ==============================================
  // 6. TÌM KIẾM
  // ==============================================

  function handleSearch(event) {

    event.preventDefault();

    const keyword = searchInput.trim();


    if (keyword === search && page === 1) {

      return;

    }


    prepareLoading();

    setSearch(keyword);

    setPage(1);

  }


  // ==============================================
  // 7. LỌC KẾT QUẢ
  // ==============================================

  function handleResultChange(value) {

    if (value === result) return;

    prepareLoading();

    setResult(value);

    setPage(1);

  }


  // ==============================================
  // 8. LỌC ĐƠN VỊ
  // ==============================================

  function handleOrganizationChange(value) {

    if (value === organizationId) return;

    prepareLoading();

    setOrganizationId(value);

    setPage(1);

  }


  // ==============================================
  // 9. ÁP DỤNG BỘ LỌC NGÀY
  // ==============================================

  function handleApplyDate() {

    setFilterError("");


    if (

      fromDateInput &&

      toDateInput &&

      fromDateInput > toDateInput

    ) {

      setFilterError(
        "Ngày bắt đầu không được lớn hơn ngày kết thúc."
      );

      return;

    }


    if (

      fromDateInput === fromDate &&

      toDateInput === toDate &&

      page === 1

    ) {

      return;

    }


    prepareLoading();

    setFromDate(fromDateInput);

    setToDate(toDateInput);

    setPage(1);

  }


  // ==============================================
  // 10. PHÂN TRANG
  // ==============================================

  function handlePageChange(value) {

    if (value === page) return;

    prepareLoading();

    setPage(value);

  }


  function handleLimitChange(value) {

    if (value === limit) return;

    prepareLoading();

    setLimit(value);

    setPage(1);

  }


  // ==============================================
  // 11. XÓA BỘ LỌC
  // ==============================================

  function handleReset() {

    setSearchInput("");

    setFromDateInput("");

    setToDateInput("");

    setFilterError("");


    if (

      !search &&

      !result &&

      !organizationId &&

      !fromDate &&

      !toDate &&

      page === 1

    ) {

      return;

    }


    prepareLoading();

    setSearch("");

    setResult("");

    setOrganizationId("");

    setFromDate("");

    setToDate("");

    setPage(1);

  }


  // ==============================================
  // 12. LÀM MỚI
  // ==============================================

  function handleRefresh() {

    prepareLoading();

    setMetadataLoading(true);

    setMetadataError("");

    setRefreshKey(
      (previous) => previous + 1
    );

  }

  // ==============================================
// XEM CHI TIẾT LỊCH SỬ XÁC THỰC
// ==============================================

function handleViewDetail(id) {

  setSelectedVerificationId(id);

}


// ==============================================
// ĐÓNG CỬA SỔ CHI TIẾT
// ==============================================

function handleCloseDetail() {

  setSelectedVerificationId(null);

}


  // ==============================================
  // 13. THẺ THỐNG KÊ
  // ==============================================

  const statisticCards = [

    {

      title: "Tổng lượt xác thực",

      value: statistics?.total,

      color: "primary",

      icon: "bi-shield-check",

    },

    {

      title: "Tài liệu hợp lệ",

      value: statistics?.valid,

      color: "success",

      icon: "bi-check-circle",

    },

    {

      title: "Không trùng khớp",

      value: statistics?.mismatch,

      color: "danger",

      icon: "bi-x-circle",

    },

    {

      title: "Đã thu hồi",

      value: statistics?.revoked,

      color: "danger",

      icon: "bi-file-earmark-x",

    },

    {

      title: "Không tìm thấy",

      value: statistics?.notFound,

      color: "warning",

      icon: "bi-search",

    },

    {

      title: "Chỉ tra cứu",

      value: statistics?.lookupOnly,

      color: "info",

      icon: "bi-eye",

    },

    {

      title: "Lỗi xác thực",

      value: statistics?.error,

      color: "secondary",

      icon: "bi-exclamation-triangle",

    },

  ];


  // ==============================================
  // 14. GIAO DIỆN
  // ==============================================

  return (

    <div className="verifications-page">

      {selectedVerificationId !== null && (

  <VerificationDetail

    key={selectedVerificationId}

    verificationId={selectedVerificationId}

    onClose={handleCloseDetail}

  />

)}
      {/* TIÊU ĐỀ */}

      <div className="verifications-heading mb-4">

        <div>

          <h3 className="fw-bold mb-2">

            Quản lý lịch sử xác thực

          </h3>

          <p className="text-secondary mb-0">

            Theo dõi kết quả xác thực tài liệu
            trong hệ thống.

          </p>

        </div>


        <button

          type="button"

          className="btn btn-outline-primary"

          onClick={handleRefresh}

          disabled={loading || metadataLoading}

        >

          <i className="bi bi-arrow-clockwise me-2"></i>

          Làm mới

        </button>

      </div>


      {/* THẺ THỐNG KÊ */}

      <div className="row g-3 mb-4">

        {statisticCards.map((item) => (

          <div

            className="col-12 col-sm-6 col-lg-4 col-xl-3"

            key={item.title}

          >

            <div className="card h-100">

              <div className="card-body">

                <div

                  className={`verification-stat-icon
                    bg-${item.color}-subtle
                    text-${item.color} mb-3`}

                >

                  <i className={`bi ${item.icon}`}></i>

                </div>


                <p className="text-secondary small mb-2">

                  {item.title}

                </p>


                <h3 className={`fw-bold text-${item.color}`}>

                  {metadataLoading || metadataError

                    ? "—"

                    : item.value ?? "—"}

                </h3>

              </div>

            </div>

          </div>

        ))}

      </div>


      {/* THÔNG BÁO LỖI */}

      {metadataError && (

        <div className="alert alert-warning">

          {metadataError}

        </div>

      )}


      {error && (

        <div className="alert alert-danger">

          {error}

        </div>

      )}


      {/* DANH SÁCH LỊCH SỬ */}

      <div className="card">

        <div className="card-header bg-white py-3">

          <h5 className="mb-0">

            Danh sách lịch sử xác thực

          </h5>

        </div>


        <div className="card-body">


          {/* TÌM KIẾM */}

          <form

            className="mb-3"

            onSubmit={handleSearch}

          >

            <label

              htmlFor="verification-search"

              className="form-label"

            >

              Tìm kiếm tài liệu

            </label>


            <div className="input-group">

              <input

                id="verification-search"

                type="text"

                className="form-control"

                placeholder="Nhập mã tài liệu, tên tài liệu hoặc đơn vị..."

                maxLength={255}

                value={searchInput}

                onChange={(event) =>

                  setSearchInput(event.target.value)

                }

              />


              <button

                type="submit"

                className="btn btn-primary"

                disabled={loading}

              >

                <i className="bi bi-search me-2"></i>

                Tìm kiếm

              </button>

            </div>

          </form>


          {/* BỘ LỌC */}

          <div className="row g-3 mb-3">


            {/* LỌC KẾT QUẢ */}

            <div className="col-md-6">

              <label

                htmlFor="verification-result"

                className="form-label"

              >

                Kết quả xác thực

              </label>


              <select

                id="verification-result"

                className="form-select"

                value={result}

                disabled={loading}

                onChange={(event) =>

                  handleResultChange(event.target.value)

                }

              >

                <option value="">
                  Tất cả kết quả
                </option>

                <option value="valid">
                  Tài liệu hợp lệ
                </option>

                <option value="mismatch">
                  Không trùng khớp
                </option>

                <option value="revoked">
                  Tài liệu đã thu hồi
                </option>

                <option value="not_found">
                  Không tìm thấy
                </option>

                <option value="lookup_only">
                  Chỉ tra cứu
                </option>

                <option value="error">
                  Lỗi xác thực
                </option>

              </select>

            </div>


            {/* LỌC ĐƠN VỊ */}

            <div className="col-md-6">

              <label

                htmlFor="verification-organization"

                className="form-label"

              >

                Đơn vị cấp phát

              </label>


              <select

                id="verification-organization"

                className="form-select"

                value={organizationId}

                disabled={loading || metadataLoading}

                onChange={(event) =>

                  handleOrganizationChange(
                    event.target.value
                  )

                }

              >

                <option value="">

                  Tất cả đơn vị

                </option>


                {organizations.map((item) => (

                  <option

                    key={item.id}

                    value={String(item.id)}

                  >

                    {item.name}

                  </option>

                ))}

              </select>

            </div>


            {/* TỪ NGÀY */}

            <div className="col-md-5">

              <label

                htmlFor="verification-from-date"

                className="form-label"

              >

                Từ ngày

              </label>


              <input

                id="verification-from-date"

                type="date"

                className="form-control"

                value={fromDateInput}

                onChange={(event) => {

                  setFromDateInput(event.target.value);

                  setFilterError("");

                }}

              />

            </div>


            {/* ĐẾN NGÀY */}

            <div className="col-md-5">

              <label

                htmlFor="verification-to-date"

                className="form-label"

              >

                Đến ngày

              </label>


              <input

                id="verification-to-date"

                type="date"

                className="form-control"

                value={toDateInput}

                onChange={(event) => {

                  setToDateInput(event.target.value);

                  setFilterError("");

                }}

              />

            </div>


            {/* ÁP DỤNG NGÀY */}

            <div className="col-md-2 d-flex align-items-end">

              <button

                type="button"

                className="btn btn-outline-primary w-100"

                onClick={handleApplyDate}

                disabled={loading}

              >

                <i className="bi bi-funnel me-1"></i>

                Áp dụng

              </button>

            </div>

          </div>


          {/* LỖI BỘ LỌC */}

          {filterError && (

            <div className="alert alert-danger py-2">

              {filterError}

            </div>

          )}


          {/* XÓA BỘ LỌC */}

          <button

            type="button"

            className="btn btn-sm btn-outline-secondary mb-3"

            onClick={handleReset}

            disabled={loading}

          >

            <i className="bi bi-x-circle me-2"></i>

            Xóa bộ lọc

          </button>


          {/* BẢNG LỊCH SỬ */}

          <div className="table-responsive">

            <table className="table table-bordered
                              table-hover align-middle
                              verifications-table">

              <thead className="table-light">

                <tr>

                  <th>STT</th>

                  <th>Mã tra cứu</th>

                  <th>Tên tài liệu</th>

                  <th>Đơn vị cấp phát</th>

                  <th>Kết quả</th>

                  <th>Thời gian xác thực</th>

                  <th>Thao tác</th>

                </tr>

              </thead>


              <tbody>

                {loading ? (

                  <tr>

                    <td

                      colSpan={7}

                      className="text-center py-5"

                    >

                      <div

                        className="spinner-border text-primary"

                        role="status"

                        aria-label="Đang tải"

                      ></div>


                      <p className="text-secondary mt-3 mb-0">

                        Đang tải lịch sử xác thực...

                      </p>

                    </td>

                  </tr>

                ) : error ? (

                  <tr>

                    <td

                      colSpan={7}

                      className="text-center py-4"

                    >

                      Không thể hiển thị dữ liệu.

                    </td>

                  </tr>

                ) : verifications.length === 0 ? (

                  <tr>

                    <td

                      colSpan={7}

                      className="text-center text-secondary py-5"

                    >

                      <i className="bi bi-inbox fs-2"></i>

                      <p className="mt-2 mb-0">

                        Không tìm thấy lịch sử xác thực.

                      </p>

                    </td>

                  </tr>

                ) : (

                  verifications.map((item, index) => (

                    <tr key={item.id}>


                      <td>

                        {(page - 1) * limit + index + 1}

                      </td>


                      <td>

                        <span

                          className="verification-code"

                          title={
                            item.searched_code ||
                            item.document_code ||
                            ""
                          }

                        >

                          {item.searched_code ||
                            item.document_code ||
                            "—"}

                        </span>

                      </td>


                      <td className="verification-title">

                        {item.document_title ||
                          "Không có thông tin"}

                      </td>


                      <td className="verification-organization">

                        {item.organization_name || "—"}

                      </td>


                      <td>

                        <VerificationStatus

                          result={item.result}

                        />

                      </td>


                      <td>

                        {formatDate(item.verified_at)}

                      </td>


                      <td>

                        <button
  type="button"
  className="btn btn-sm btn-outline-primary"
  onClick={() => handleViewDetail(item.id)}
>

  <i className="bi bi-eye me-1"></i>

  Chi tiết

</button>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>


          {/* PHÂN TRANG */}

          {!loading && !error && (

            <Pagination

              page={pagination.page}

              limit={pagination.limit}

              total={pagination.total}

              totalPages={pagination.totalPages}

              onPageChange={handlePageChange}

              onLimitChange={handleLimitChange}

              loading={loading}

            />

          )}

        </div>

      </div>


      {/* GHI CHÚ */}

      <p className="small text-secondary mt-3">

        <i className="bi bi-info-circle me-2"></i>

        Thống kê được tính trên toàn bộ lịch sử xác thực.
        Kết quả xác thực phản ánh trạng thái tại thời điểm
        kiểm tra tài liệu.

      </p>

    </div>

  );

}

export default Verifications;