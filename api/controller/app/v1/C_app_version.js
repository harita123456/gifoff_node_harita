const app_versions = require("../../../models/M_app_version");
const users = require("../../../models/M_user");
const request = require("../../../models/M_request");

//user is now pending
const { successRes, errorRes } = require("../../../../utils/common_fun");

// add app version
const addAppVersion = async (req, res) => {
  try {
    let {
      app_version,
      is_maintenance,
      app_update_status,
      app_platform,
      app_url,
      api_base_url,
      is_live,
    } = req.body;

    let insert_qry = await app_versions.create({
      app_version,
      is_maintenance,
      app_update_status,
      app_platform,
      app_url,
      api_base_url,
      is_live,
    });

    return await successRes(res, `App version added successfully`, insert_qry);
  } catch (error) {
    console.log(error);
    return errorRes(res, "Internal server error");
  }
};

const appVersionCheck = async (req, res) => {
  try {
    let { app_version, user_id, app_platform, device_token } = req.body;

    var result = [];

    let check_version = await app_versions.findOne().where({
      app_version: app_version,
      is_live: true,
      app_platform: app_platform,
      is_deleted: false,
    });

    var data = {
      device_type: app_platform,
      device_token: device_token,
    };

    if (user_id) {
      // data = { ...data, user_id: user_id };

      var find_user = await users.findById(user_id);

      if (find_user) {
        let friend_requests_count = await request.countDocuments({
          friend_id: user_id,
          is_deleted: false,
          request_status: { $in: ["sent"] },
        });

        result = {
          ...result,
          is_deleted: find_user.is_deleted,
          is_block: find_user.is_block,
          request_count: friend_requests_count,
        };
      }

      if (device_token != undefined) {
        if (app_platform) {
          if (app_platform == "ios") {
            // var device_type = "ios";
          } else {
            // var device_type = "android";
          }
        }
      }

      await users.findByIdAndUpdate(user_id, {
        $set: {
          app_version: app_version,
        },
      });
    }

    /* let query = {
        user_id: user_id,
      };
      let request = {
        $set: data,
      };
      let options = { upsert: true, new: true };
      await app_installed_user.updateOne(query, request, options); */

    var app_update_status = "";

    if (check_version) {
      if (check_version.app_version != app_version) {
        app_update_status = check_version.app_update_status;

        if (app_update_status == "is_force_update") {
          result = {
            ...result,
            is_need_update: true,
            is_force_update: true,
          };
        } else {
          result = {
            ...result,
            is_need_update: true,
            is_force_update: false,
          };
        }
      } else {
        result = {
          ...result,
          is_need_update: false,
          is_force_update: false,
        };
      }

      result["is_maintenance"] = check_version.is_maintenance;
    } else {
      let check_version = await app_versions.findOne().where({
        is_live: true,
        app_platform: app_platform,
        is_deleted: false,
      });

      if (!check_version) {
        return errorRes(
          res,
          "Sorry, No any version available for this platform!!"
        );
      }

      app_update_status = check_version.app_update_status;

      if (app_update_status == "is_force_update") {
        result = { ...result, is_need_update: true, is_force_update: true };
      } else {
        result = {
          ...result,
          is_need_update: true,
          is_force_update: false,
        };
      }
      result["is_maintenance"] = check_version.is_maintenance;
    }

    return await successRes(res, `App version check successfully`, result);
  } catch (error) {
    console.log(error);
    return errorRes(res, "Internal server error");
  }
};

module.exports = {
  addAppVersion,
  appVersionCheck,
};
