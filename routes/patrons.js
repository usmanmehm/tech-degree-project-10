const express = require('express');
const router = express.Router();

const Patrons = require('../models').Patrons;
const Loans = require('../models').Loans;
const Books = require('../models').Books;

const Sequelize = require('sequelize');
const Op = Sequelize.Op;

// Create association
Patrons.hasMany(Loans, { foreignKey: 'patron_id' });

// Queries
// Default Query
const query = {
    attributes: ["id", "first_name", "last_name", "address", "email", "library_id", "zip_code"]
}

// Query for patron details page
const detailsQuery = {
    attributes: query.attributes,
    include: {
        model: Loans, attributes: ["id", "book_id", "patron_id", "loaned_on", "return_by", "returned_on"],
        include: { model: Books, attributes: ["title"]}
    }
}

router.get('/', function(req, res, next) {
    // Pagination variables
    const page = req.query.page ? req.query.page : 1;
    const numPerPage = 10;
    const offset = (page - 1) * numPerPage;
    let totalPatrons;

    // Search related variables
    let q;
    query.offset = 0;
    query.limit = 1000; // setting this so that when using search, there is no limit on the books returned
    if(req.query.q) {
        q = req.query.q;
        query.where = {
            [Op.or]: {
                first_name: { [Op.like]: "%" + q + "%" },
                last_name: { [Op.like]: "%" + q + "%" },
                address: { [Op.like]: "%" + q + "%" },
                library_id: { [Op.like]: "%" + q + "%" }
            }
        }
    } else {
        query.where = {};
    }

    // Querying the Database
    Patrons.findAll(query).then( patrons => {
        totalPatrons = patrons.length; // for page numbers
        query.offset = offset; // to offset and limit the number of results to display
        query.limit = numPerPage;
    }).then( () => {
        Patrons.findAll(query).then( patrons => {
        res.render('patrons', { patrons, currentPage: page, numPerPage, totalPatrons, q });
      })
    });
});

// New Patron
router.get('/new', function(req, res, next) {
    res.render('new-patron', { patron: Patrons.build() });
});

router.post('/', (req, res, next) => {
    Patrons.create(req.body).then( () => {
        res.redirect('patrons');
    }).catch( err => {
        if(err.name === "SequelizeValidationError") {
            const errorMessages = err.message.split("Validation error:");

            const errors = {
                firstName: {
                    msg: filterErrorMessage("first name", errorMessages)
                },
                lastName: {
                    msg: filterErrorMessage("last name", errorMessages)
                },
                address: {
                    msg: filterErrorMessage("address", errorMessages)
                },
                email: {
                    msg: filterErrorMessage("email", errorMessages)
                },
                library: {
                    msg: filterErrorMessage("Library", errorMessages)
                },
                zip: {
                    msg: filterErrorMessage("zip", errorMessages)
                }
            }
            res.render("new-patron", { patron: Patrons.build(req.body), errors });
        }
        else throw err;
    }).catch( err => {
        res.sendStatus(500);
    })
})

// Patron Details
let patronDetails; // this variable is in place in case of an error - we won't lose the patron information
router.get('/details/:id', function(req, res, next) {
    const id = req.params.id;
    Patrons.findById(id, detailsQuery).then ( patron => {
        patronDetails = patron;
        res.render('patron-details', { patron });
    });
});
// Update patron details
router.put('/details/:id', (req, res) => {
    Patrons.findByPk(req.params.id, detailsQuery).then( patron => {
        if (patron) {
            return patron.update(req.body);
        }
        else res.sendStatus(404);
    }).then( () => {
        res.redirect('/patrons');
    }).catch( err => {
        if(err.name === "SequelizeValidationError") {
            const errorMessages = err.message.split("Validation error:");

            const errors = {
                firstName: {
                    msg: filterErrorMessage("first name", errorMessages)
                },
                lastName: {
                    msg: filterErrorMessage("last name", errorMessages)
                },
                address: {
                    msg: filterErrorMessage("address", errorMessages)
                },
                email: {
                    msg: filterErrorMessage("email", errorMessages)
                },
                library: {
                    msg: filterErrorMessage("Library", errorMessages)
                },
                zip: {
                    msg: filterErrorMessage("zip", errorMessages)
                }
            }
            res.render('patron-details', { patron: patronDetails, errors })
        }
    })
})

router.get('/delete/:id', (req, res) => {
    Patrons.findByPk(req.params.id).then( patron => {
        res.render('delete-patron', { patron });
    })
})

router.put('/delete/:id', (req, res) => {
    // in case someone moves, has violated library terms, etc... we would want to delete them
    // we want to delete the patron, and the loans associated with that patron
    Loans.findAll( { where: { patron_id: req.params.id }} ).then( loans => {
        loans.map( loan => {
            loan.destroy( { force: true });
        })
    }).then( () => {
        Patrons.findByPk(req.params.id).then( patron => {
            return patron.destroy( { force: true });
        }).then( () => {
        res.redirect('/patrons');
        })
    });
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