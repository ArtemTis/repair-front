import React from "react";
import './Pagination.css';
import { Button } from "../../shared/ui";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="pagination">
      <Button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="pagination-button"
        variant="ghost"
      >
        Назад
      </Button>
      
      {pages.map((page) => (
        <Button
          key={page}
          onClick={() => onPageChange(page)}
          className={currentPage === page ? "pagination-button active" : "pagination-button"}
          variant={currentPage === page ? "primary" : "ghost"}
        >
          {page}
        </Button>
      ))}
      
      <Button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="pagination-button"
        variant="ghost"
      >
        Вперед
      </Button>
    </div>
  );
};

export default Pagination;