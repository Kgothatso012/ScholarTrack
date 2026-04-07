// Pagination Component - Simple pagination controls for admin screens

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing, borderRadius, typography } from '../../ui-plugin/theme';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  totalItems?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage = 20,
  totalItems,
}) => {
  const { colors } = useTheme();

  if (totalPages <= 1) return null;

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return pages.map((page, index) => {
      if (page === '...') {
        return (
          <Text key={`ellipsis-${index}`} style={[styles.ellipsis, { color: colors.textSecondary }]}>
            ...
          </Text>
        );
      }
      const pageNum = page as number;
      const isActive = pageNum === currentPage;
      return (
        <TouchableOpacity
          key={pageNum}
          onPress={() => onPageChange(pageNum)}
          style={[
            styles.pageButton,
            isActive && { backgroundColor: colors.primary },
          ]}
        >
          <Text
            style={[
              styles.pageText,
              { color: isActive ? colors.textInverse : colors.text },
            ]}
          >
            {pageNum}
          </Text>
        </TouchableOpacity>
      );
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.pages}>{renderPageNumbers()}</View>
      {totalItems !== undefined && (
        <Text style={[styles.info, { color: colors.textSecondary }]}>
          Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  pages: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  pageText: {
    ...typography.label,
  },
  ellipsis: {
    paddingHorizontal: spacing.xs,
    ...typography.label,
  },
  info: {
    ...typography.caption,
  },
});

export default Pagination;