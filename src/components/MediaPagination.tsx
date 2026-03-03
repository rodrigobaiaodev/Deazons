
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MediaPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const MediaPagination = ({ currentPage, totalPages, onPageChange }: MediaPaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-10 flex justify-center">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft size={18} />
        </Button>
        
        <div className="flex items-center gap-1">
          {currentPage > 2 && (
            <Button
              variant={currentPage === 1 ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(1)}
            >
              1
            </Button>
          )}
          
          {currentPage > 3 && (
            <span className="px-2 text-muted-foreground">...</span>
          )}
          
          {currentPage > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
            >
              {currentPage - 1}
            </Button>
          )}
          
          <Button variant="default" size="sm">
            {currentPage}
          </Button>
          
          {currentPage < totalPages && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
            >
              {currentPage + 1}
            </Button>
          )}
          
          {currentPage < totalPages - 2 && (
            <span className="px-2 text-muted-foreground">...</span>
          )}
          
          {currentPage < totalPages - 1 && (
            <Button
              variant={currentPage === totalPages ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </Button>
          )}
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight size={18} />
        </Button>
      </div>
    </div>
  );
};

export default MediaPagination;
