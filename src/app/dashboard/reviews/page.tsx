"use client"
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { Loader } from "@/components/ui/loader";
import MegaLoader from '@/components/ui/MegaLoader';

interface Review {
  id: string;
  content: string;
  rating: number;
  student_name: string;
  created_at: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalReviews: number;
  reviewsPerPage: number;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalReviews: 0,
    reviewsPerPage: 25
  });

  const fetchReviews = async (page: number) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/reviews?page=${page}`);
      if (response.data.success) {
        setReviews(response.data.reviews);
        setPagination(response.data.pagination);
      } else {
        throw new Error(response.data.message || 'Failed to fetch reviews');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to fetch reviews';
      setError(errorMessage);
      toast.error("Failed to load reviews", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(currentPage);
  }, [currentPage]);

  // Filter reviews based on search query
  const filteredReviews = reviews.filter((review) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (review.student_name?.toLowerCase() || '').includes(searchLower) ||
      (review.content?.toLowerCase() || '').includes(searchLower)
    );
  });

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (loading) {
    return <MegaLoader/>
  }

  if (error) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="text-red-500 text-lg font-medium">{error}</div>
          <Button 
            onClick={() => fetchReviews(currentPage)}
            className="bg-primary hover:bg-primary text-white transition-colors duration-200"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 bg-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-primary">Reviews</h1>
          <span className="text-sm text-gray-600">
            Showing {((currentPage - 1) * pagination.reviewsPerPage) + 1} - {Math.min(currentPage * pagination.reviewsPerPage, pagination.totalReviews)} of {pagination.totalReviews}
          </span>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4" />
          <Input
            placeholder="Search reviews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 bg-white border transition-all duration-200"
          />
        </div>
      </div>

      <div className="mb-6 p-4 bg-amber-50 border rounded-lg">
        <p className="text-amber-700 text-sm">
          Note: Hostel management can only view reviews and cannot edit them.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredReviews.map((review) => (
          <div
            key={review.id}
            className="bg-white rounded-lg border p-4 sm:p-6 hover:border-primary transition-all duration-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-primary">{review.student_name}</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-lg sm:text-xl ${
                      i < review.rating ? "text-primary" : "text-gray-200"
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            <p className="text-sm sm:text-base text-gray-700">{review.content}</p>
          </div>
        ))}
      </div>

      {filteredReviews.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg text-primary">No reviews found</p>
          <p className="text-sm text-gray-600 mt-2">
            Try adjusting your search
          </p>
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {pagination.totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pagination.totalPages}
              className="flex items-center gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 