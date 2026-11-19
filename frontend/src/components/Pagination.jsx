function Pagination({
  page = 1,
  limit = 10,
  total = 0,
  totalPages = 0,
  onPageChange,
  onLimitChange,
  loading = false,
}) {

  // ================================================
  // 1. TÍNH VỊ TRÍ HIỂN THỊ
  // ================================================

  const start =
    total === 0 ? 0 : (page - 1) * limit + 1;

  const end =
    Math.min(page * limit, total);


  // ================================================
  // 2. TẠO DANH SÁCH SỐ TRANG
  // ================================================

  const firstPage = Math.max(
    1,
    Math.min(page - 2, totalPages - 4)
  );

  const lastPage = Math.min(
    totalPages,
    firstPage + 4
  );

  const pageNumbers = [];

  for (let i = firstPage; i <= lastPage; i++) {

    pageNumbers.push(i);

  }


  // ================================================
  // 3. CHUYỂN TRANG
  // ================================================

  function changePage(nextPage) {

    if (
      loading ||
      nextPage < 1 ||
      nextPage > totalPages ||
      nextPage === page
    ) return;

    onPageChange(nextPage);

  }


  // ================================================
  // 4. GIAO DIỆN
  // ================================================

  return (

    <div className="document-pagination">

      <div className="pagination-information">

        <span className="small text-secondary">

          Hiển thị {start}–{end} / {total} kết quả

        </span>

        {onLimitChange && (

          <div className="pagination-limit">

            <label className="small text-secondary">

              Số kết quả mỗi trang

              <select
                className="form-select form-select-sm mt-1"
                value={limit}
                disabled={loading}
                onChange={(event) =>
                  onLimitChange(Number(event.target.value))
                }
              >

                <option value={10}>10</option>

                <option value={20}>20</option>

                <option value={50}>50</option>

                <option value={100}>100</option>

              </select>

            </label>

          </div>

        )}

      </div>


      {totalPages > 0 && (

        <nav aria-label="Phân trang">

          <ul className="pagination pagination-sm mb-0">

            {/* TRANG ĐẦU */}

            <li className={`page-item ${
              page <= 1 || loading ? "disabled" : ""
            }`}>

              <button
                type="button"
                className="page-link"
                aria-label="Trang đầu"
                disabled={page <= 1 || loading}
                onClick={() => changePage(1)}
              >

                <i className="bi bi-chevron-double-left"></i>

              </button>

            </li>


            {/* TRANG TRƯỚC */}

            <li className={`page-item ${
              page <= 1 || loading ? "disabled" : ""
            }`}>

              <button
                type="button"
                className="page-link"
                aria-label="Trang trước"
                disabled={page <= 1 || loading}
                onClick={() => changePage(page - 1)}
              >

                <i className="bi bi-chevron-left"></i>

              </button>

            </li>


            {/* SỐ TRANG */}

            {pageNumbers.map((number) => (

              <li
                key={number}
                className={`page-item ${
                  number === page ? "active" : ""
                }`}
              >

                <button
                  type="button"
                  className="page-link"
                  aria-current={
                    number === page ? "page" : undefined
                  }
                  disabled={loading || number === page}
                  onClick={() => changePage(number)}
                >

                  {number}

                </button>

              </li>

            ))}


            {/* TRANG SAU */}

            <li className={`page-item ${
              page >= totalPages || loading ? "disabled" : ""
            }`}>

              <button
                type="button"
                className="page-link"
                aria-label="Trang sau"
                disabled={page >= totalPages || loading}
                onClick={() => changePage(page + 1)}
              >

                <i className="bi bi-chevron-right"></i>

              </button>

            </li>


            {/* TRANG CUỐI */}

            <li className={`page-item ${
              page >= totalPages || loading ? "disabled" : ""
            }`}>

              <button
                type="button"
                className="page-link"
                aria-label="Trang cuối"
                disabled={page >= totalPages || loading}
                onClick={() => changePage(totalPages)}
              >

                <i className="bi bi-chevron-double-right"></i>

              </button>

            </li>

          </ul>

        </nav>

      )}

    </div>

  );

}

export default Pagination;