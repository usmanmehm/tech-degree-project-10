const express = require('express');
const router = express.Router();

const Books = require('../models').Books;
const Loans = require('../models').Loans;
const Patrons = require('../models').Patrons;

const Sequelize = require('sequelize');
const Op = Sequelize.Op;

// Create association
Books.hasMany(Loans, { foreignKey: 'book_id' });

// Queries

//Default Query
const query = {
    attributes: [ "id", "title", "author", "genre", "first_published"]
};

// Different Queries for different filters
const overdueLoans = {
    attributes: [ "book_id" ],
    where: {
        [Op.and]: {
            return_by: {
                [Op.lt]: new Date()
            },
            returned_on: null
        }
    }
};

const overdueBooks = {
    attributes: query.attributes,
    where: {
        id: {
        }
    }
};

const checkedLoans = {
    attributes: [ "book_id" ],
    where: {
        [Op.and]: {
            return_by: {
                [Op.ne]: null
            },
            returned_on: null
        }
    }
};

const checkedBooks = {
    attributes: query.attributes,
    where: {
        id: {
        }
    }
};

const detailsQuery = {
    attributes: query.attributes,
    include: { 
            model: Loans, attributes: ["id", "book_id", "patron_id", "loaned_on", "return_by", "returned_on"],
            include: { model: Patrons, attributes: ["first_name", "last_name"]} 
    }
};

// All Books
router.get('/', function(req, res, next) {
    
    // Pagination variables
    const page = req.query.page ? req.query.page : 1;
    const numPerPage = 10;
    const offset = (page - 1) * numPerPage;
    let totalBooks;

    // Overdue Books
    if(req.query.filter === "overdue") {
        Loans.findAll(overdueLoans)
            .then( loans => {
                const bookIds = loans.map( loan => loan.book_id);
                totalBooks = bookIds.length;
                overdueBooks.where.id = {
                    [Op.in]: bookIds
                };
                overdueBooks.offset = offset;
                overdueBooks.limit = numPerPage;
                return Books.findAll(overdueBooks);
            })
            .then( books => {
                res.render('books', { books, currentPage: page, totalBooks, numPerPage });
            });
    } 

    // Checked out Books
    else if (req.query.filter === "checked_out") {
        Loans.findAll(checkedLoans)
            .then( loans => {
                const bookIds = loans.map( loan => loan.book_id);
                totalBooks = bookIds.length;
                checkedBooks.where.id = {
                    [Op.in]: bookIds
                };
                checkedBooks.offset = offset;
                checkedBooks.limit = numPerPage;
                return Books.findAll(checkedBooks);
            })
            .then( books => {
                res.render('books', { books, currentPage: page, totalBooks, numPerPage });
            })
    } 

    // All Books
    else {
        // Search related variables
        const displayAll = true;
        let q;
        query.offset = 0;
        query.limit = 1000; // setting this so that when using search, there is no limit on the books returned
        if(req.query.q) {
            q = req.query.q;
            query.where = {
                [Op.or]: {
                    title: { [Op.like]: "%" + q + "%" },
                    author: { [Op.like]: "%" + q + "%" },
                    genre: { [Op.like]: "%" + q + "%" }
                }
            }
        } else {
            query.where = {};
        }

        // Querying the database
        Books.findAll(query).then( books => {
            totalBooks = books.length; // for accurate page numbers
            query.offset = offset; // setting a limit to the results displayed
            query.limit = numPerPage;
        }).then( () => {
            Books.findAll(query).then( books => {
                res.render('books', { books, currentPage: page, totalBooks, numPerPage, q, displayAll });
            })
        })
    }
});


// New Book
router.get('/new', (req, res) => {
    res.render('new-book', { book: Books.build() });
});

router.post('/', (req, res, next) => {
    Books.create(req.body).then( () => {
        res.redirect('/books');
    }).catch( err => {
        if(err.name === "SequelizeValidationError") {
            // We want an array of the messages split by every instance of "Validation error"
            const errorMessages = err.message.split("Validation error:");

            const errors = {
                title: {
                    msg: filterErrorMessage("title", errorMessages)
                },
                author: {
                    msg: filterErrorMessage("author", errorMessages)
                },
                genre: {
                    msg: filterErrorMessage("genre", errorMessages)
                },
                firstPublished: {
                    msg: filterErrorMessage("published", errorMessages)
                }
            }
            res.render("new-book", { book: Books.build(req.body), errors });
        }
        else throw err;
    }).catch( err => {
        res.sendStatus(500);
    })
})

// Book Details
let bookDetails; // this variable will store all the book details in case there is an error - we won't lose the info
router.get('/details/:id', (req, res) => {
    const id = req.params.id;
    Books.findByPk(id, detailsQuery).then( book => {
        bookDetails = book;
        res.render('book-details', { book });
    });
});

// Update book details
router.put('/details/:id', (req, res) => {
    Books.findByPk(req.params.id, detailsQuery).then( book => {
        if (book) {
            return book.update(req.body);
        }
        else res.sendStatus(404);
    }).then( (book) => {
        res.redirect('/books');
        return book
    }).catch( err => {
        if(err.name === "SequelizeValidationError") {
            const errorMessages = err.message.split("Validation error:");

            const errors = {
                title: {
                    msg: filterErrorMessage("title", errorMessages)
                },
                author: {
                    msg: filterErrorMessage("author", errorMessages)
                },
                genre: {
                    msg: filterErrorMessage("genre", errorMessages)
                },
                firstPublished: {
                    msg: filterErrorMessage("published", errorMessages)
                }
            }
            res.render('book-details', { book: bookDetails, errors })
        }
    })
})

const filterErrorMessage = (type, messages) => {
    messages = messages.filter( message => {
        return message.indexOf(type) > -1;
    });

    return messages.map (message => {
        const endOfString = message[message.length - 1];
        if (endOfString === "\n") {
            return message.substr(0, message.length - 2);
        }
        return message;
    })
};
  
module.exports = router;