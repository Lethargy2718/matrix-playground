export const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    const rounded = Math.round(num * 100) / 100;

    if (Math.abs(rounded) < 1e-10) return '0';

    if (rounded === Math.floor(rounded)) {
        return rounded.toString();
    }

    return rounded.toString();
};

export const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

// NOTE: This function assumes the matrix is already in RREF
export const isPivotElement = (data, row, col, pivotCols) => {
    if (!pivotCols.includes(col)) return false;

    const value = data[row][col];
    if (Math.abs(value - 1) > 1e-10) return false;

    // Check if this is the first non-zero in the row
    for (let j = 0; j < col; j++) {
        if (Math.abs(data[row][j]) > 1e-10) return false;
    }

    return true;
};