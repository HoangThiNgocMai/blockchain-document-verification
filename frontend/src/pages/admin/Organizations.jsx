import { useState, useEffect } from "react";
import organizationApi from "../../api/organizationApi.js";
import OrganizationStatus from "../../components/OrganizationStatus.jsx";
import OrganizationForm from "../../components/OrganizationForm.jsx";
import OrganizationBlockchainStatus from "../../components/OrganizationBlockchainStatus.jsx";
import OrganizationAuthorization from "../../components/OrganizationAuthorization.jsx";
import "../../styles/organizations.css";

function isAuthorized(value) {
  return [1, "1", true].includes(value);
}

function isUnauthorized(value) {
  return [0, "0", false].includes(value);
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("vi-VN");
}

function Organizations() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");
  const [modal, setModal] = useState(null);

  // 1. Lấy danh sách đơn vị
  useEffect(() => {
    let cancelled = false;

    async function fetchOrganizations() {
      try {
        const response = await organizationApi.getAll();
        if (cancelled) return;
        if (!response.success || !Array.isArray(response.data)) {
          setError("Dữ liệu danh sách đơn vị không hợp lệ.");
          return;
        }
        setOrganizations(response.data);
      } catch (err) {
        if (cancelled) return;
        const statusCode = err.response?.status;
        if (statusCode === 403) {
          setError("Bạn không có quyền truy cập chức năng này.");
        } else if (statusCode === 401) {
          setError("Phiên đăng nhập đã hết hạn.");
        } else if (!err.response) {
          setError("Không thể kết nối đến máy chủ.");
        } else {
          setError("Không thể tải danh sách đơn vị cấp phát.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchOrganizations();
    return () => { cancelled = true; };
  }, [refreshKey]);

  // 2. Làm mới dữ liệu
  function handleRefresh() {
    setLoading(true);
    setError("");
    setRefreshKey(previous => previous + 1);
  }

  // 3. Thêm, sửa và kiểm tra Blockchain
  function handleAdd() {
    setSuccessMessage("");
    setModal({ type: "form", organization: null });
  }

  function handleEdit(organization) {
    setSuccessMessage("");
    setModal({ type: "form", organization });
  }

  function handleCloseForm() {
    setModal(null);
  }

  function handleSaveSuccess(message) {
    setSuccessMessage(message);
    handleCloseForm();
    handleRefresh();
  }

  function handleCheckBlockchain(organization) {
    setModal({ type: "blockchain", organization });
  }

  function handleCloseBlockchain() {
    setModal(null);
  }

  // 4. Cấp và thu hồi quyền Blockchain
  function handleAuthorization(organization, action) {
    setSuccessMessage("");
    setModal({ type: "authorization", organization, action });
  }

  function handleCloseAuthorization() {
    setModal(null);
    handleRefresh();
  }

  function handleAuthorizationSuccess(message) {
    setSuccessMessage(message);
    handleRefresh();
  }

  // 5. Thống kê, tìm kiếm và lọc
  const total = organizations.length;
  const authorizedCount = organizations.filter(item => isAuthorized(item.is_authorized)).length;
  const unauthorizedCount = organizations.filter(item => isUnauthorized(item.is_authorized)).length;
  const keyword = search.trim().toLowerCase();
  const filteredOrganizations = organizations.filter(item => {
    const name = (item.name || "").toLowerCase();
    const wallet = (item.wallet_address || "").toLowerCase();
    const matchSearch = name.includes(keyword) || wallet.includes(keyword);
    const matchStatus = status === "all" ||
      (status === "authorized" && isAuthorized(item.is_authorized)) ||
      (status === "unauthorized" && isUnauthorized(item.is_authorized));
    return matchSearch && matchStatus;
  });

  // 6. Giao diện quản lý đơn vị
  return (
    <div className="organizations-page">
      {modal?.type === "form" && (
        <OrganizationForm
          key={modal.organization?.id ?? "new"}
          organization={modal.organization}
          onClose={handleCloseForm}
          onSuccess={handleSaveSuccess}
        />
      )}
      {modal?.type === "blockchain" && (
        <OrganizationBlockchainStatus
          key={modal.organization.id}
          organization={modal.organization}
          onClose={handleCloseBlockchain}
        />
      )}
      {modal?.type === "authorization" && (
        <OrganizationAuthorization
          key={`${modal.organization.id}-${modal.action}`}
          organization={modal.organization}
          action={modal.action}
          onClose={handleCloseAuthorization}
          onSuccess={handleAuthorizationSuccess}
        />
      )}

      <div inert={modal ? true : undefined}>
        <div className="organizations-heading mb-4">
          <div>
            <h3 className="fw-bold mb-2">Quản lý đơn vị cấp phát</h3>
            <p className="text-secondary mb-0">Quản lý thông tin các đơn vị tham gia hệ thống.</p>
          </div>
          <button type="button" className="btn btn-outline-primary" onClick={handleRefresh} disabled={loading}>
            <i className="bi bi-arrow-clockwise me-2"></i>
            {loading ? "Đang tải..." : "Làm mới"}
          </button>
        </div>

        <div className="row g-3 mb-4">
          {[
            ["Tổng số đơn vị", total, "primary"],
            ["Đã cấp quyền", authorizedCount, "success"],
            ["Chưa cấp quyền", unauthorizedCount, "secondary"],
          ].map(([title, value, color]) => (
            <div className="col-md-4" key={title}>
              <div className="card h-100">
                <div className="card-body">
                  <p className="text-secondary mb-2">{title}</p>
                  <h2 className={`fw-bold text-${color}`}>{loading || error ? "—" : value}</h2>
                </div>
              </div>
            </div>
          ))}
        </div>

        {successMessage && (
          <div className="alert alert-success alert-dismissible" role="status">
            <i className="bi bi-check-circle me-2"></i>
            {successMessage}
            <button type="button" className="btn-close" aria-label="Đóng thông báo" onClick={() => setSuccessMessage("")}></button>
          </div>
        )}
        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-circle me-2"></i>{error}
          </div>
        )}

        <div className="card">
          <div className="card-header bg-white py-3 d-flex flex-wrap gap-2 justify-content-between align-items-center">
            <h5 className="mb-0">Danh sách đơn vị cấp phát</h5>
            <button type="button" className="btn btn-primary" onClick={handleAdd} disabled={loading || Boolean(error)}>
              <i className="bi bi-plus-lg me-2"></i>Thêm đơn vị
            </button>
          </div>
          <div className="card-body">
            <div className="row g-3 mb-4">
              <div className="col-md-8">
                <label htmlFor="organization-search" className="form-label">Tìm kiếm</label>
                <div className="input-group">
                  <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
                  <input id="organization-search" type="text" className="form-control" placeholder="Nhập tên đơn vị hoặc địa chỉ ví..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
              <div className="col-md-4">
                <label htmlFor="organization-status" className="form-label">Trạng thái</label>
                <select id="organization-status" className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="all">Tất cả trạng thái</option>
                  <option value="authorized">Đã cấp quyền</option>
                  <option value="unauthorized">Chưa cấp quyền</option>
                </select>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle organizations-table">
                <thead className="table-light">
                  <tr>
                    <th>STT</th><th>Tên đơn vị</th><th>Địa chỉ ví Blockchain</th>
                    <th>Trạng thái</th><th>Ngày tạo</th><th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-5">
                      <div className="spinner-border text-primary" role="status" aria-label="Đang tải dữ liệu"></div>
                      <p className="text-secondary mt-3 mb-0">Đang tải danh sách đơn vị...</p>
                    </td></tr>
                  ) : error ? (
                    <tr><td colSpan={6} className="text-center py-4">Không thể hiển thị dữ liệu.</td></tr>
                  ) : filteredOrganizations.length === 0 ? (
                    <tr><td colSpan={6} className="text-center text-secondary py-4">Không tìm thấy đơn vị phù hợp.</td></tr>
                  ) : filteredOrganizations.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td className="fw-medium">{item.name}</td>
                      <td><span className="organization-wallet" title={item.wallet_address}>{item.wallet_address || "—"}</span></td>
                      <td><OrganizationStatus authorized={item.is_authorized} /></td>
                      <td>{formatDate(item.created_at)}</td>
                      <td>
                        <div className="organization-actions d-flex flex-wrap gap-2">
                          <button type="button" className="btn btn-sm btn-outline-primary" title="Chỉnh sửa đơn vị" aria-label="Chỉnh sửa đơn vị" onClick={() => handleEdit(item)}>
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button type="button" className="btn btn-sm btn-outline-primary" title="Kiểm tra quyền Blockchain" aria-label="Kiểm tra quyền Blockchain" onClick={() => handleCheckBlockchain(item)}>
                            <i className="bi bi-shield-check"></i>
                          </button>
                          <button type="button" className="btn btn-sm btn-outline-success" title="Cấp quyền Blockchain" disabled={!isUnauthorized(item.is_authorized)} onClick={() => handleAuthorization(item, "authorize")}>
                            <i className="bi bi-shield-plus me-1"></i>Cấp quyền
                          </button>
                          <button type="button" className="btn btn-sm btn-outline-danger" title="Thu hồi quyền Blockchain" disabled={!isAuthorized(item.is_authorized)} onClick={() => handleAuthorization(item, "deauthorize")}>
                            <i className="bi bi-shield-x me-1"></i>Thu hồi
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!loading && !error && (
              <p className="small text-secondary mb-0">Hiển thị {filteredOrganizations.length}/{total} đơn vị cấp phát.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Organizations;
