"use strict";
function module_fn(global){
    
    global.ddengine = global.ddengine || {};
    global.ddengine.factories = global.ddengine.factories || {};

    function Matrix(row_size, col_size){
        this._data = Array(row_size*col_size);
        this._shape = [row_size, col_size];
        this._size = row_size*col_size;
        this.__cache = {};
    }

    Matrix.prototype.r = function(row, col){
        return this._data[this._shape[1] * row + col];
    };

    Matrix.prototype.w = function(row, col, v){
        this._data[this._shape[1] * row + col] = v;
    };

    Matrix.prototype.clone = function(){
        let theClone = new Matrix(this._shape[0], this._shape[1]);
        
        for(let i = 0; i < this._size; i++){
            theClone._data[i] = this._data[i];
        }

        return theClone;
    };

    Matrix.prototype.row = function(row){
        var result = Array(this._shape[1]);

        for(let c = 0; c < this._shape[1]; c++){
            result[c] = this.r(row, c);
        }

        return result;
    };

    Matrix.prototype.column = function(col){
        var result = Array(this._shape[0]);

        for(let r = 0; r < this._shape[0]; r++){
            result[r] = this.r(r, col);
        }

        return result;
    };

    Matrix.prototype.diag = function(){
        var result = [];

        for (let i = 0; i < this._shape[0]; i++) {
            result.push(this.r(i,i));
        }

        return result;
    };

    Matrix.prototype.trace = function(){
        var result = 0;

        for (let i = 0; i < this._shape[0]; i++) {
            result += this.r(i,i);
        }

        return result;
    };

    Matrix.prototype.transpose = function(){
        var other = new Matrix(this._shape[1], this._shape[0]);

        for (let r = 0; r < this._shape[0]; r++) {
            for (let c = 0; c < this._shape[1]; c++) {
                other.w(c, r, this.r(r,c));
            }
        }

        return other;
    };

    Matrix.prototype.isDiagonal = function(){
        let r = 0;
        let c = 0;

        for (let i = 0; i < this._shape[0]*this._shape[1]; i++) {
            if (c == r && this.r(r,c) == 0)
                return false;
            
            if (c != r && this.r(r,c) != 0)
                return false;
            
            c += 1;

            if (c > this._shape[1]){
                r += 1;
                c = 0;
            }
        }

        return true;
    };

    Matrix.prototype.isSymmetric = function(){
        for (let r = 0; r < this._shape[0]; r++) {
            for (let c = r; c < this._shape[1]; c++){
                if(this.r(r,c) != this.r(c,r))
                    return false;
            }
        }

        return true;
    };

    Matrix.prototype.isIdentity = function(){
        if (this.__cache.isIdentity !== undefined)
            return this.__cache.isIdentity;

        let result = true;
        let r = 0;
        let c = 0;

        for (let i = 0; i < this._shape[0]*this._shape[1]; i++) {
            if (c == r && this.r(r,c) != 1)
                result = false;
            
            
            if (c != r && this.r(r,c) != 0)
                result = false;
            
            
            c += 1;

            if (c > this._shape[1]){
                r += 1;
                c = 0;
            }
        }

        this.__cache.isIdentity = result;

        return result;
    };

    Matrix.prototype.isZero = function(){
        if (this.__cache.isZero !== undefined)
            return this.__cache.isZero;

        let r = 0;
        let c = 0;
        let result = true;

        for (let i = 0; i < this._shape[0]*this._shape[1]; i++) {
            if (this.r(r,c) != 0)
                result = false;
                        
            c += 1;

            if (c > this._shape[1]){
                r += 1;
                c = 0;
            }
        }

        this.__cache.isZero = result;

        return result;
    };

    Matrix.prototype.isSquare = function(){
        return this._shape[0] == this._shape[1];
    };

    Matrix.prototype.multiplyMatrix = function(other){
        if(this._shape[1] != other._shape[0])
            throw new Error("Incompatible sizes for multiplication.");

        let result = new Matrix(this._shape[0], other._shape[1]);
        let v;

        for (let r = 0; r < result._shape[0]; r++) {
            for (let c = 0; c < result._shape[1]; c++){
                v = 0;
                for (let k = 0; k < this._shape[1]; k++){
                    v += (this.r(r,k) * other.r(k,c));
                }
                result.w(r, c, v);
            }
        }

        return result;
    };

    Matrix.prototype.add = function(other){
        if(this._shape[0] != other._shape[0] || this._shape[1] != this._shape[1] )
            throw new Error("Incompatible sizes for subtraction.");

        let result = new Matrix(this._shape[0], this._shape[1]);
        let v;

        for (let r = 0; r < result._shape[0]; r++) {
            for (let c = 0; c < result._shape[1]; c++){
                v = this.r(r, c) + other.r(r, c);
                result.w(r, c, v);
            }
        }

        return result;
    };

    Matrix.prototype.subtract = function(other){
        if(this._shape[0] != other._shape[0] || this._shape[1] != this._shape[1] )
            throw new Error("Incompatible sizes for subtraction.");

        let result = new Matrix(this._shape[0], this._shape[1]);
        let v;

        for (let r = 0; r < result._shape[0]; r++) {
            for (let c = 0; c < result._shape[1]; c++){
                v = this.r(r, c) - other.r(r, c);
                result.w(r, c, v);
            }
        }

        return result;
    };

    Matrix.prototype.multiplyScalar = function(scalar){
        let result = new Matrix(this._shape[0], this._shape[1]);
        let v;
        
        for (let r = 0; r < result._shape[0]; r++) {
            for (let c = 0; c < result._shape[1]; c++){
                v = this.r(r, c) * scalar;
                result.w(r, c, v);
            }
        }

        return result;
    };

    Matrix.prototype.addScalar = function(scalar){
        let result = new Matrix(this._shape[0], this._shape[1]);
        let v;
        
        for (let r = 0; r < result._shape[0]; r++) {
            for (let c = 0; c < result._shape[1]; c++){
                result.w(r, c, this.r(r, c) + scalar);
            }
        }

        return result;
    };

    Matrix.prototype.shape = function(){
        return this._shape.map(e => e);
    };

    Matrix.prototype.size = function(){
        return this._size;
    };

    Matrix.prototype.augment = function(vector){
        let result = new Matrix(this._shape[0], this._shape[1] + 1);

        for(let r = 0; r < this._shape[0]; r++){
            for(let c = 0; c < this._shape[1]; c++){
                result.w(r, c, this.r(r, c));
            }
            result.w(r, this._shape[1], vector[r]);
        }

        return result;
    };

    Matrix.prototype.concat_h = function(other){
        if (this._shape[0] != other._shape[0]){
            return null;
        }

        let work = new Matrix(this._shape[0], this._shape[1] + other._shape[0]);

        for (let r = 0; r < other._shape[0]; r++){
            for (let c = 0; c < other._shape[0]; c++){
                work.w(r, c, this.r(r,c));
                work.w(r, this._shape[1] + c, other.r(r,c));
            }
        }

        return work;
    };

    Matrix.prototype.concat_v = function(other){
        if (this._shape[1] != other._shape[1]){
            return null;
        }

        let work = new Matrix(this._shape[0] + other._shape[0], this._shape[1]);

        for (let r = 0; r < other._shape[0]; r++){
            for (let c = 0; c < other._shape[0]; c++){
                work.w(r, c, this.r(r,c));
                work.w(this._shape[0] + r, c, other.r(r,c));
            }
        }

        return work;
    };

    Matrix.prototype.inverse = function(){
        if (this._shape[0] != this._shape[1]){
            return null;
        }

        let n = this._shape[0];
        let work = this.concat_h(Matrix.identity(n));
        work = Matrix.reducedRowEchelonForm(work);

        let solution = new Matrix(n,n);

        for (let r = 0; r < n; r++){
            for (let c = 0; c < n; c++){
                solution.w(r, c, work.r(r, n + c));
            }
        }

        return solution;
    };

    Matrix.prototype.toString = function(){
        let result = "[\n";
        for(let r = 0; r < this._shape[0]; r++){
            result += "   [ ";
            for(let c = 0; c < this._shape[1]; c++){
                result += pretty(this.r(r,c), 2) + (c == (this._shape[1] - 1) ? "" : ", ");
            }
            result += " ]\n";
        }
        result += "]";
        return result;
    };

    Matrix.prototype.toJS = function(){
        var result = Array(this._shape[0]);
        for(let r = 0; r < this._shape[0]; r++){
            result[r] = this.row(r);
        }

        return result;
    };

    /*
        factories
    */
    Matrix.zeros = function(row_size, col_size){
        let m = new Matrix(row_size, col_size);
        m._data.fill(0);
        return m;
    };

    Matrix.ones = function(row_size, col_size){
        let m = new Matrix(row_size, col_size);
        m._data.fill(1);
        return m;
    };

    Matrix.from_data = function(data){
        let m;

        if (Array.isArray(data)){
            if (Array.isArray(data[0])){
                m = new Matrix(data.length, data[0].length);
                for (let r = 0; r < data.length; r++){
                    for (let c = 0; c < data[0].length; c++){
                        m.w(r,c,data[r][c]);
                    }
                }
            }
            else{
                m = null;
            }
        }
        else{
            if (Number.isNaN(data)){
                m = null;
            }
            else{
                m = new Matrix(1,1);
                m.w(0,0,data);
            }
        }

        return m;
    };

    Matrix.from_vector = function(vector){
        let m;

        if (Array.isArray(vector)){
            if (Number.isNaN(vector[0])){
                m = null;
            }
            else{
                m = new Matrix(vector.length, 1);
                for (let r = 0; r < vector.length; r++){
                    m.w(r, 0, vector[r]);
                }
            }
        }
        else{
            m = null;
        }

        return m;
    };

    Matrix.identity = function(size){
        let result = new Matrix(size, size);
        result._data.fill(0);

        for (let i = 0; i < size; i++){
            result.w(i, i, 1);
        }

        return result;
    };

    Matrix.rowEchelonForm = function(m){
        m = m.clone();
        let n = m.shape()[0];
        let nn = m.shape()[1];
        let max, argmax;

        // perform the gaussian elimination method
        for (let p = 0; p < n; p++){
            // find the element with largest absolute value in col p
            max = Math.abs(m.r(p,p));
            argmax = p;
            for (let i = p; i < n; i++){
                if (Math.abs(m.r(i,p)) > max){
                    max = Math.abs(m.r(i,p));
                    argmax = i;
                }
            }

            // if max is zero, stop!
            if (max == 0)
                return null;
            
            // if max element not in row p, swap rows
            if (argmax != p){
                for(let i = 0; i < nn; i++){
                    let v = m.r(p, i);
                    m.w(p, i, m.r(argmax, i));
                    m.w(argmax, i, v);
                }
            }

            // set pivot element to 1. multiply row p by 1/A[p][p]
            let v = 1 / m.r(p,p);
            for(let i = 0; i < nn; i++){
                m.w(p, i, m.r(p,i) * v);
            }

            // clear lower column entries
            let leadValue;
            for (let r = p + 1; r < n; r++){
                leadValue = m.r(r, p);

                for (let c = p ; c < nn; c++){
                    m.w(r, c, m.r(r, c) - leadValue * m.r(p, c));
                }
            }
        }

        return m;
    };

    Matrix.reducedRowEchelonForm = function(m){
        m = Matrix.rowEchelonForm(m.clone());
        let n = m._shape[0];

        if (m == null){
            return null;
        }

        let leadValue;
        for (let p = n - 1; p >= 0; p--){
            for (let r = p - 1; r >= 0; r--){
                leadValue = m.r(r, p);

                for (let c = m._shape[1] - 1 ; c >= r; c--){
                    m.w(r, c, -leadValue * m.r(p, c) + m.r(r, c));
                }
            }
        }

        return m;
    };

    function pretty(v, n){
        n = n || 2;
        var scalar = Math.pow(10, n);
        return Math.floor(v * scalar) / scalar;
    }

    global.ddengine.Matrix = Matrix;

}

(function(){
   try{
        module_fn(window);
   }
   catch(e){
        module_fn(module.exports);
   }
})();