const dotenv = require("dotenv");
const validator = require("validator");
const bcrypt = require("bcrypt");
const ImageHelper = require("../helpers/ImageHelper.js");
const UserModel = require("../models/UserModel.js");

class User {
  async updatePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;
      let oldPasswordDb = await UserModel.getOneUser("id", req.jwt.id);

      const comparePassword = await bcrypt.compareSync(
        oldPassword,
        oldPasswordDb.password
      );

      if (!comparePassword) {
        throw { code: 400, message: "PASSWORD_NOT_MATCH" };
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      const updatePassword = await UserModel.updatePassword(
        hashedPassword,
        req.jwt.id
      );
      return res.status(200).json({
        status: true,
        message: "PASSWORD_UPDATED",
      });
    } catch (err) {
      return res.status(err.code || 500).json({
        status: false,
        message: err.message,
      });
    }
  }
  async updateProfile(req, res) {
    try {
      let { name, username, email, phone, home_town } = req.body;
      const oldData = await UserModel.getOneUser("id", req.jwt.id);
      let avatar;

      if (!name) {
        name = oldData.name;
      }

      if (!username) {
        username = oldData.username;
      } else if (username !== oldData.username) {
        let usernameAlreadyExist = await UserModel.getOneUser(
          "username",
          req.body.username
        );
        if (usernameAlreadyExist) {
          throw { code: 400, message: "USERNAME_ALREADY_EXIST" };
        }
      }

      if (!email) {
        email = oldData.email;
      } else if (email !== oldData.email) {
        let emailAlreadyExist = await UserModel.getOneUser(
          "email",
          req.body.email
        );
        if (emailAlreadyExist) {
          throw { code: 400, message: "EMAIL_ALREADY_EXIST" };
        }
      }

      if (!phone) {
        phone = oldData.phone;
      } else if (phone !== oldData.phone) {
        let phoneNumberAlreadyExist = await UserModel.getOneUser(
          "phone",
          req.body.phone
        );
        if (phoneNumberAlreadyExist) {
          throw { code: 400, message: "PHONE_ALREADY_EXIST" };
        }
      }

      function validatePhoneNumber(phoneNumber) {
        const cleanedNumber = phoneNumber.replace(/\D/g, "");
        if (!validator.isMobilePhone(cleanedNumber, "id-ID")) {
          throw { code: 400, message: "PHONE_INVALID" };
        }
      }
      if (!home_town) {
        home_town = oldData.home_town;
      }
      if (req.file && req.file.cloudStorageObject) {
        avatar = req.file.cloudStorageObject;
        if (
          oldData.profile_picture !== "default-user.png" &&
          oldData.profile_picture !== avatar
        ) {
          ImageHelper.deleteFromGCS(oldData.profile_picture);
        }
      } else {
        avatar = oldData.profile_picture;
      }
      const updateProfile = await UserModel.updateProfile(
        name,
        username,
        email,
        phone,
        home_town,
        avatar,
        req.jwt.id
      );
      return res.status(200).json({
        status: true,
        message: "UPDATE_PROFILE_SUCCESS",
        data: updateProfile,
      });
    } catch (err) {
      console.log(err);
      return res.status(err.code || 500).json({
        status: false,
        message: err.message,
      });
    }
  }
  async getOneUser(req, res) {
    try {
      const getProfile = await UserModel.getOneUser("id", req.jwt.id);
      return res.status(200).json({
        status: true,
        message: "GET_PROFILE_SUCCESS",
        data: {
          name: getProfile.name,
          username: getProfile.username,
          email: getProfile.email,
          phone: getProfile.phone,
          location: getProfile.home_town,
          age: getProfile.age,
          profile_picture: ImageHelper.getPublicUrl(
            "avatar",
            getProfile.profile_picture
          ),
        },
      });
    } catch (err) {
      return res.status(err.code || 500).json({
        status: false,
        message: err.message,
      });
    }
  }
  async profileCheck(req, res) {}
}
module.exports = new User();
